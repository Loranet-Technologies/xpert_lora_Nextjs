"use client";

import { useState } from "react";
import { createDevice } from "../../../lib/api/api";

export default function CreateDevicePage() {
  const [formData, setFormData] = useState({
    device_id: "",
    application_id: "",
    payload_template: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.device_id || !formData.application_id) {
      setError("Device ID and Application ID are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let payloadTemplate = {};
      if (formData.payload_template.trim()) {
        try {
          payloadTemplate = JSON.parse(formData.payload_template);
        } catch (parseError) {
          setError("Invalid JSON in payload template");
          return;
        }
      }

      const response = (await createDevice({
        device_id: formData.device_id,
        application_id: formData.application_id,
        payload_template: payloadTemplate,
      })) as { success?: boolean; error?: string };

      if (response.success) {
        setSuccess(`Device ${formData.device_id} created successfully!`);
        setFormData({
          device_id: "",
          application_id: "",
          payload_template: "",
        });
      } else {
        setError(response.error || "Failed to create device");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateRandomDevice = () => {
    const deviceId = `device_${Math.random().toString(36).substr(2, 9)}`;
    const appId = `app_${Math.random().toString(36).substr(2, 6)}`;

    setFormData((prev) => ({
      ...prev,
      device_id: deviceId,
      application_id: appId,
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          🔧 Create Test Device
        </h1>

        <div className="bg-white  text-black rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID *
              </label>
              <input
                type="text"
                name="device_id"
                value={formData.device_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., sensor_001"
                required
              />
            </div>

            {/* Application ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID *
              </label>
              <input
                type="text"
                name="application_id"
                value={formData.application_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., weather_app"
                required
              />
            </div>

            {/* Payload Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload Template (Optional)
              </label>
              <textarea
                name="payload_template"
                value={formData.payload_template}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='{"custom_field": "value", "location": "indoor"}'
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter JSON format. This will be merged with default sensor data
                (temperature, humidity, battery).
              </p>
            </div>

            {/* Random Generator Button */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={generateRandomDevice}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Generate Random IDs
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
            >
              {loading ? "Creating Device..." : "Create Test Device"}
            </button>
          </form>

          {/* Success Message */}
          {success && (
            <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Example Section */}
        <div className="mt-8 bg-white  text-black rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">
            📝 Example Payload Templates
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Weather Sensor:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "pressure": 1013.25,
  "wind_speed": 5.2,
  "location": "outdoor"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">IoT Device:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "status": "active",
  "location": "room_1",
  "device_type": "motion_sensor"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Custom Data:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "custom_metric": 42,
  "description": "Test device",
  "category": "demo"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
