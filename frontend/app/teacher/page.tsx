import NavBar from "@/components/NavBar";

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Teacher Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-600">Assignment creation and submission review goes here.</p>
      </main>
    </div>
  );
}
