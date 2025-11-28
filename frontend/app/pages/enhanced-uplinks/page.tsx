"use client";

import { useState, useEffect } from "react";
import {
  getRecentUplinks,
  getUplinkApplications,
  getUplinkDevices,
  simulateUplink,
  fetchStats,
} from "../../../lib/api/api";

interface Uplink {
  _id: string;
  device_id: string;
  application_id: string;
  topic: string;
  payload: any;
  ts: string;
}

interface UplinkApp {
  application_id: string;
  uplink_count: number;
  device_count: number;
  last_uplink: string;
}

interface UplinkDevice {
  device_id: string;
  application_id: string;
  uplink_count: number;
  last_uplink: string;
  first_uplink: string;
}

interface Stats {
  total_uplinks: number;
  unique_devices: number;
  unique_applications: number;
  uplinks_last_24h: number;
}

export default function EnhancedUplinksPage() {
  const [recentUplinks, setRecentUplinks] = useState<Uplink[]>([]);
  const [applications, setApplications] = useState<UplinkApp[]>([]);
  const [devices, setDevices] = useState<UplinkDevice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "recent" | "apps" | "devices" | "simulate"
  >("recent");

  // Simulation form state
  const [simDeviceId, setSimDeviceId] = useState("");
  const [simAppId, setSimAppId] = useState("");
  const [simPayload, setSimPayload] = useState("");
  const [simFPort, setSimFPort] = useState(1);
  const [simulating, setSimulating] = useState(false);

  // Filter state
  const [selectedApp, setSelectedApp] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [recentRes, appsRes, devicesRes, statsRes] = (await Promise.all([
        getRecentUplinks(20),
        getUplinkApplications(),
        getUplinkDevices(),
        fetchStats(),
      ])) as any[];

      setRecentUplinks(recentRes.data || []);
      setApplications(appsRes.data || []);
      setDevices(devicesRes.data || []);
      setStats(statsRes.stats || null);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDevicesForApp = async (appId: string) => {
    if (!appId) {
      const res = (await getUplinkDevices()) as any;
      setDevices(res.data || []);
      return;
    }

    try {
      const res = (await getUplinkDevices(appId)) as any;
      setDevices(res.data || []);
    } catch (err: any) {
      console.error("Failed to load devices:", err);
      setError(`Failed to load devices: ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "devices") {
      loadDevicesForApp(selectedApp);
    }
  }, [selectedApp, activeTab]);

  const handleSimulateUplink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDeviceId || !simAppId) {
      setError("Device ID and Application ID are required");
      return;
    }

    setSimulating(true);
    setError(null);

    try {
      const payload = simPayload ? JSON.parse(simPayload) : undefined;
      await simulateUplink({
        device_id: simDeviceId,
        application_id: simAppId,
        payload: payload,
        f_port: simFPort,
      });

      // Reset form
      setSimDeviceId("");
      setSimAppId("");
      setSimPayload("");
      setSimFPort(1);

      // Reload recent uplinks
      const res = (await getRecentUplinks(20)) as any;
      setRecentUplinks(res.data || []);
    } catch (err: any) {
      setError(`Failed to simulate uplink: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const formatPayload = (payload: any) => {
    if (!payload) return "N/A";

    if (payload.decoded_payload) {
      return JSON.stringify(payload.decoded_payload, null, 2);
    }

    if (payload.raw_hex) {
      return `Hex: ${payload.raw_hex}`;
    }

    if (payload.raw_base64) {
      return `Base64: ${payload.raw_base64}`;
    }

    return JSON.stringify(payload, null, 2);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold mb-8 text-black">
          Enhanced Uplinks Dashboard
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Total Uplinks
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total_uplinks}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Unique Devices
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.unique_devices}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Applications
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {stats.unique_applications}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Last 24h</h3>
              <p className="text-2xl font-bold text-orange-600">
                {stats.uplinks_last_24h}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "recent", label: "Recent Uplinks" },
              { key: "apps", label: "Applications" },
              { key: "devices", label: "Devices" },
              { key: "simulate", label: "Simulate" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md">
          {activeTab === "recent" && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Recent Uplinks</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        App ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payload
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentUplinks.map((uplink) => (
                      <tr key={uplink._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {uplink.device_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {uplink.application_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(uplink.ts).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <pre className="text-xs max-w-xs overflow-hidden">
                            {formatPayload(uplink.payload)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentUplinks.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No recent uplinks found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "apps" && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Applications</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uplinks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devices
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Uplink
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.application_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.uplink_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.device_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.last_uplink).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applications.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No applications found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "devices" && (
            <div>
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Devices</h2>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">
                      Filter by App:
                    </label>
                    <select
                      value={selectedApp}
                      onChange={(e) => setSelectedApp(e.target.value)}
                      className="p-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">All Applications</option>
                      {applications.map((app) => (
                        <option
                          key={app.application_id}
                          value={app.application_id}
                        >
                          {app.application_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uplinks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Seen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.map((device) => (
                      <tr
                        key={`${device.device_id}-${device.application_id}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {device.device_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.application_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.uplink_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(device.first_uplink).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(device.last_uplink).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {devices.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No devices found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "simulate" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Simulate Uplink</h2>
              <form
                onSubmit={handleSimulateUplink}
                className="space-y-4 max-w-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device ID *
                    </label>
                    <input
                      type="text"
                      value={simDeviceId}
                      onChange={(e) => setSimDeviceId(e.target.value)}
                      placeholder="e.g. device-001"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application ID *
                    </label>
                    <input
                      type="text"
                      value={simAppId}
                      onChange={(e) => setSimAppId(e.target.value)}
                      placeholder="e.g. app-001"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FPort
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="223"
                    value={simFPort}
                    onChange={(e) => setSimFPort(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payload (JSON, optional)
                  </label>
                  <textarea
                    value={simPayload}
                    onChange={(e) => setSimPayload(e.target.value)}
                    placeholder='{"temperature": 23.5, "humidity": 65}'
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for random sensor data
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={simulating || !simDeviceId || !simAppId}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {simulating ? "Simulating..." : "Simulate Uplink"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
