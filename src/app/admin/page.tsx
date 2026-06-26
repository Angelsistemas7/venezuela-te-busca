import { adminConfigured, isAdmin } from "@/lib/admin";
import { getPendingReports, getPersonById, getRecentPersons } from "@/lib/data";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard, type ReportWithName } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  const [pending, persons] = await Promise.all([getPendingReports(), getRecentPersons(30)]);

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

  return <AdminDashboard reports={reports} persons={persons} demoOpen={!adminConfigured} />;
}
