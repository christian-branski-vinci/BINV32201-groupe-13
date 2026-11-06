import type { Application } from "../models/application.ts";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface ApplicationTableProps {
  applications: Application[];
  onWithdraw: (id: number) => void;
}

const ApplicationTable = ({ applications, onWithdraw }: ApplicationTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr><th>Offre</th><th>Entreprise</th><th>Année</th><th>Période</th><th>Statut</th><th>Action</th></tr>
      </thead>
      <tbody>
        {applications.map((application) => {
          const canWithdraw = application.status === "IN_PROGRESS" || application.status === "SELECTED";
          return (
            <tr key={application.id}>
              <td>{application.offerTitle}</td>
              <td>{application.companyShortName}</td>
              <td>{application.academicYear}</td>
              <td>{PERIOD_LABELS[application.period]}</td>
              <td><StatusBadge label={APPLICATION_STATUS_LABELS[application.status]} tone={APPLICATION_STATUS_TONES[application.status]} /></td>
              <td>{canWithdraw && <button type="button" onClick={() => onWithdraw(application.id)}>Retirer</button>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ApplicationTable;
