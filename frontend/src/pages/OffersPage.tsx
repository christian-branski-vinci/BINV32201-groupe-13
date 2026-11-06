import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import type { PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";
import type { Offer } from "../models/offer.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const PERIOD_OPTIONS: { value: PeriodCode | ""; label: string }[] = [
  { value: "", label: "Toutes les périodes" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "OTHER", label: "Autre" },
];

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | "">("");
  const { offers, isLoading, error } = useOffers(token, onUnauthorized, period || undefined);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [message, setMessage] = useState("");
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitApplication = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedOffer === null) return;
    setIsSubmitting(true);
    setApplicationError(null);
    createApplication(token, selectedOffer.id, message)
      .then(() => {
        setSelectedOffer(null);
        setMessage("");
      })
      .catch((reason: unknown) => {
        if (isUnauthorized(reason)) onUnauthorized();
        else setApplicationError(reason instanceof Error ? reason.message : "Erreur inconnue");
      })
      .finally(() => setIsSubmitting(false));
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable offers={offers} onApply={user.kind === "STUDENT" ? setSelectedOffer : undefined} />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <label>
        Période
        <select value={period} onChange={(event) => setPeriod(event.target.value as PeriodCode | "")}>
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {selectedOffer && (
        <form onSubmit={submitApplication}>
          <h2>Candidater à « {selectedOffer.title} »</h2>
          <label htmlFor="application-message">Message (facultatif)</label>
          <textarea
            id="application-message"
            value={message}
            maxLength={2000}
            onChange={(event) => setMessage(event.target.value)}
          />
          {applicationError && <ErrorState message={applicationError} />}
          <button type="submit" disabled={isSubmitting}>Envoyer la candidature</button>
          <button type="button" onClick={() => setSelectedOffer(null)}>Annuler</button>
        </form>
      )}
      {renderContent()}
    </section>
  );
};

export default OffersPage;
