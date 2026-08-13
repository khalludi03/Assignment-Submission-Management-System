import NavBar from "@/components/NavBar";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Student Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-600">Your assignments and submissions go here.</p>
      </main>
    </div>
  );
}
