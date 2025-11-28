"use client";

import { useState, useEffect } from "react";
import {
  listDownlinks,
  sendDownlink,
  listCsDevices,
  listCsApplications,
  listOrganizations,
} from "../../../lib/api/api";

interface Downlink {
  _id: string;
  device_eui: string;
  application_id: string;
  f_port: number;
  data: string;
  confirmed: boolean;
  status: string;
  sent_at: string;
  acknowledged_at?: string;
  error_message?: string;
}

interface Device {
  devEui: string;
  name: string;
}

interface Application {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function DownlinksPage() {
  const [downlinks, setDownlinks] = useState<Downlink[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [fPort, setFPort] = useState<number>(1);
  const [payload, setPayload] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [sending, setSending] = useState(false);

  // Filter state
  const [filterDevice, setFilterDevice] = useState<string>("");
  const [filterApp, setFilterApp] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const loadDownlinks = async () => {
    try {
      const response = (await listDownlinks({
        device_eui: filterDevice || undefined,
        application_id: filterApp || undefined,
        status: filterStatus || undefined,
        limit: 50,
      })) as any;
      setDownlinks(response.data || []);
    } catch (err) {
      console.error("Failed to load downlinks:", err);
      setError("Failed to load downlinks");
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = (await listOrganizations({ limit: 100 })) as any;
      setOrganizations(response.resultList || []);
    } catch (err) {
      console.error("Failed to load organizations:", err);
    }
  };

  const loadApplications = async (orgId: string) => {
    if (!orgId) {
      setApplications([]);
      return;
    }
    try {
      const response = (await listCsApplications({
        organizationId: orgId,
        limit: 100,
      })) as any;
      setApplications(response.resultList || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
    }
  };

  const loadDevices = async (appId: string) => {
    if (!appId) {
      setDevices([]);
      return;
    }
    try {
      const response = (await listCsDevices({
        applicationId: appId,
        limit: 100,
      })) as any;
      setDevices(response.resultList || []);
    } catch (err) {
      console.error("Failed to load devices:", err);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([loadDownlinks(), loadOrganizations()]);
      setLoading(false);
    };
    initLoad();
  }, [filterDevice, filterApp, filterStatus]);

  useEffect(() => {
    loadApplications(selectedOrg);
    setSelectedApp("");
    setSelectedDevice("");
  }, [selectedOrg]);

  useEffect(() => {
    loadDevices(selectedApp);
    setSelectedDevice("");
  }, [selectedApp]);

  const handleSendDownlink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedApp || !payload) {
      setError("Please fill in all required fields");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendDownlink({
        device_eui: selectedDevice,
        application_id: selectedApp,
        f_port: fPort,
        payload: payload,
        confirmed: confirmed,
      });

      // Reset form
      setPayload("");
      setFPort(1);
      setConfirmed(false);

      // Reload downlinks
      await loadDownlinks();
    } catch (err: any) {
      setError(`Failed to send downlink: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "acknowledged":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold mb-8 text-black">
          Downlinks Management
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Send Downlink Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Send Downlink</h2>
          <form onSubmit={handleSendDownlink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application
                </label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!selectedOrg}
                >
                  <option value="">Select Application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!selectedApp}
                >
                  <option value="">Select Device</option>
                  {devices.map((device) => (
                    <option key={device.devEui} value={device.devEui}>
                      {device.name} ({device.devEui})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FPort
                </label>
                <input
                  type="number"
                  min="1"
                  max="223"
                  value={fPort}
                  onChange={(e) => setFPort(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payload (Hex)
                </label>
                <input
                  type="text"
                  value={payload}
                  onChange={(e) =>
                    setPayload(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
                  }
                  placeholder="e.g. 01020304"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mr-2"
                />
                Confirmed downlink
              </label>

              <button
                type="submit"
                disabled={sending || !selectedDevice || !payload}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Downlink"}
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter Downlinks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device EUI
              </label>
              <input
                type="text"
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                placeholder="Filter by device EUI"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID
              </label>
              <input
                type="text"
                value={filterApp}
                onChange={(e) => setFilterApp(e.target.value)}
                placeholder="Filter by application ID"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Downlinks List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Downlinks History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device EUI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FPort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {downlinks.map((downlink) => (
                  <tr key={downlink._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {downlink.device_eui}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {downlink.application_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {downlink.f_port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {Buffer.from(downlink.data, "base64")
                        .toString("hex")
                        .toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          downlink.status
                        )}`}
                      >
                        {downlink.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(downlink.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {downlinks.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No downlinks found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
