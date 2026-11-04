import ApplicationTable from "../components/ApplicationTable.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { useApplications } from "../hooks/useApplications.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdraw } = useApplications(token, onUnauthorized);
  const handleWithdraw = (id: number) => {
    if (window.confirm("Retirer cette candidature ?")) {
      void withdraw(id);
    }
  };

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p>Vos candidatures de l’année académique en cours.</p>
      {error && <ErrorState message={error} />}
      {isLoading ? <LoadingState /> : applications.length === 0 ? <EmptyState message="Aucune candidature à afficher." /> : (
        <ApplicationTable applications={applications} onWithdraw={handleWithdraw} />
      )}
    </section>
  );
};

export default ApplicationsPage;
