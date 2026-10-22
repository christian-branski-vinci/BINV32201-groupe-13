import { toOffer } from "../mappers/offer.mapper.ts";
import type { Offer, OfferStatus } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import type { OfferFilter, OfferInput, OffersRepository } from "../repositories/offers.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { canManageOffer, canReviewOffers, hasContactRole, isAdmin, isStudent } from "./permissions.ts";

/**
 * Offres visibles selon le profil (CdC § 4) : toutes pour l'administrateur, les offres
 * publiées pour l'étudiant, les offres qu'il a déposées pour un déposant.
 */
const visibilityFilter = (viewer: User): OfferFilter => {
  if (isAdmin(viewer)) return {};
  if (isStudent(viewer)) return { status: "PUBLISHED" };
  if (hasContactRole(viewer, "DEPOSITOR")) return { depositorContactId: viewer.id };
  throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès aux offres");
};

const validateOfferInput = (viewer: User, input: OfferInput): void => {
  if (input.title.trim() === "") {
    throw new HttpError(400, "INVALID_BODY", "Le titre est obligatoire");
  }
  if (input.description.trim() === "") {
    throw new HttpError(400, "INVALID_BODY", "La description est obligatoire");
  }
  if (!canManageOffer(viewer) && !isAdmin(viewer)) {
    throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas le droit de gérer des offres");
  }
};

export const createOffersService = (repository: OffersRepository) => ({
  listOffers: (viewer: User): Offer[] => repository.findAll(visibilityFilter(viewer)).map(toOffer),

  createOffer: (viewer: User, input: OfferInput): Offer => {
    validateOfferInput(viewer, input);
    const offer = repository.create({
      ...input,
      status: input.status ?? "SUBMITTED",
    });
    return toOffer(offer);
  },

  updateOffer: (viewer: User, id: number, input: OfferInput): Offer => {
    validateOfferInput(viewer, input);
    const current = repository.findById(id);
    if (current === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (!isAdmin(viewer) && current.depositor_contact_id !== viewer.id) {
      throw new HttpError(403, "FORBIDDEN", "Vous ne pouvez modifier que vos offres");
    }
    if (current.status !== "SUBMITTED" && current.status !== "PENDING" && !isAdmin(viewer)) {
      throw new HttpError(400, "INVALID_BODY", "Cette offre ne peut plus être modifiée");
    }
    const updated = repository.update(id, {
      ...input,
      status: input.status ?? current.status,
    });
    if (updated === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    return toOffer(updated);
  },

  removeOffer: (viewer: User, id: number): void => {
    const current = repository.findById(id);
    if (current === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (!isAdmin(viewer) && current.depositor_contact_id !== viewer.id) {
      throw new HttpError(403, "FORBIDDEN", "Vous ne pouvez supprimer que vos offres");
    }
    if (current.status !== "SUBMITTED" && current.status !== "PENDING" && !isAdmin(viewer)) {
      throw new HttpError(400, "INVALID_BODY", "Cette offre ne peut plus être retirée");
    }
    if (repository.hasLinkedInternship(id)) {
      throw new HttpError(400, "INVALID_BODY", "Cette offre est liée à un stage et ne peut pas être supprimée");
    }
    if (!repository.delete(id)) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
  },

  setOfferStatus: (viewer: User, id: number, status: OfferStatus): Offer => {
    if (!canReviewOffers(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas le droit de valider cette offre");
    }
    const current = repository.findById(id);
    if (current === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    const updated = repository.updateStatus(id, status);
    if (updated === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    return toOffer(updated);
  },
});

export type OffersService = ReturnType<typeof createOffersService>;
