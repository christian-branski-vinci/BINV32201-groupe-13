import { toApplication } from "../mappers/application.mapper.ts";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

const MAX_MESSAGE_LENGTH = 2000;

const requireStudent = (viewer: User): void => {
  if (!isStudent(viewer)) {
    throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut gérer ses candidatures");
  }
};

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  listApplications: (viewer: User): Application[] => {
    requireStudent(viewer);
    return repository.findAllByStudent(viewer.id).map(toApplication);
  },

  createApplication: (viewer: User, offerId: number, message: string | null): Application => {
    requireStudent(viewer);
    if (!repository.offerIsPublished(offerId)) {
      throw new HttpError(400, "INVALID_BODY", "L'offre n'est pas publiée ou n'existe pas");
    }
    if (repository.hasActiveForOffer(offerId, viewer.id)) {
      throw new HttpError(400, "INVALID_BODY", "Vous avez déjà une candidature active pour cette offre");
    }
    if (message !== null && message.length > MAX_MESSAGE_LENGTH) {
      throw new HttpError(400, "INVALID_BODY", `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`);
    }
    return toApplication(repository.create(offerId, viewer.id, message === null || message.trim() === "" ? null : message.trim()));
  },

  withdrawApplication: (viewer: User, id: number): Application => {
    requireStudent(viewer);
    const current = repository.findById(id);
    if (current === undefined || current.student_id !== viewer.id) {
      throw new HttpError(404, "NOT_FOUND", "Candidature introuvable");
    }
    if (current.status !== "IN_PROGRESS" && current.status !== "SELECTED") {
      throw new HttpError(400, "INVALID_BODY", "Cette candidature ne peut plus être retirée");
    }
    const withdrawn = repository.withdraw(id, viewer.id);
    if (withdrawn === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Candidature introuvable");
    }
    return toApplication(withdrawn);
  },

  currentAcademicYear: (): string | undefined => repository.currentAcademicYear(),
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
