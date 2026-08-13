import NavBar from "@/components/NavBar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Admin Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-600">User, class, subject, and teacher assignment management goes here.</p>
      </main>
    </div>
  );
}
