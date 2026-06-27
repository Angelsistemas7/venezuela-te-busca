import { adminConfigured, isAdmin } from "@/lib/admin";
import {
  getAidPoints,
  getAllResourceManagers,
  getHospitals,
  getPendingReports,
  getPersonById,
  getPosts,
  getRecentPersons,
} from "@/lib/data";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard, type ReportWithName } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  const [pending, persons, aidPoints, hospitals, managers, posts] = await Promise.all([
    getPendingReports(),
    getRecentPersons(30),
    getAidPoints(),
    getHospitals(),
    getAllResourceManagers(),
    getPosts({}),
  ]);

  // Enriquecemos cada reporte con el nombre de la persona.
  const reports: ReportWithName[] = await Promise.all(
    pending.map(async (r) => {
      const person = await getPersonById(r.personId);
      const personName = person
        ? `${person.firstName} ${person.lastName}`.trim() || "Sin identificar"
        : "Persona";
      return { ...r, personName };
    }),
  );

  // Hospitales de más recientes a más antiguos (para revisar lo nuevo primero).
  const hospitalsRecent = hospitals
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AdminDashboard
      reports={reports}
      persons={persons}
      aidPoints={aidPoints}
      hospitals={hospitalsRecent}
      managers={managers}
      posts={posts.slice(0, 25)}
      demoOpen={!adminConfigured}
    />
  );
}
