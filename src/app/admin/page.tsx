import { adminConfigured, isAdmin } from "@/lib/admin";
import {
  getAidPoints,
  getAllAppRoles,
  getAllResourceManagers,
  getComplaints,
  getHeroes,
  getHospitals,
  getPendingExternalPosts,
  getPendingReports,
  getPersonsByIds,
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

  const [
    pending,
    persons,
    aidPoints,
    hospitals,
    managers,
    posts,
    heroes,
    complaintsPage,
    roles,
    pendingExternalPosts,
  ] = await Promise.all([
    getPendingReports(),
    getRecentPersons(30),
    getAidPoints(),
    getHospitals(),
    getAllResourceManagers(),
    getPosts({}),
    getHeroes({ includeUnverified: true }),
    getComplaints({}, 1, 25),
    getAllAppRoles(),
    getPendingExternalPosts(),
  ]);

  // Enriquecemos cada reporte con el nombre de la persona (una sola consulta, no N+1).
  const personsById = await getPersonsByIds(pending.map((r) => r.personId));
  const reports: ReportWithName[] = pending.map((r) => {
    const person = personsById.get(r.personId);
    const personName = person
      ? `${person.firstName} ${person.lastName}`.trim() || "Sin identificar"
      : "Persona";
    return { ...r, personName };
  });

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
      heroes={heroes}
      complaints={complaintsPage.items}
      roles={roles}
      pendingExternalPosts={pendingExternalPosts}
      demoOpen={!adminConfigured}
    />
  );
}
