import { Router } from "express";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { OfferStatus } from "../models/offer.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canListOffers, canManageOffer, canReviewOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const OFFER_STATUSES: readonly OfferStatus[] = ["SUBMITTED", "PENDING", "PUBLISHED", "ASSIGNED", "ARCHIVED"];

const parsePositiveInt = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, "INVALID_BODY", `${field} doit être un entier positif`);
  }
  return value;
};

const parseNullablePositiveInt = (value: unknown, field: string): number | null => {
  if (value === null) return null;
  return parsePositiveInt(value, field);
};

const parseOfferStatus = (value: unknown): OfferStatus => {
  if (typeof value !== "string" || !OFFER_STATUSES.includes(value as OfferStatus)) {
    throw new HttpError(400, "INVALID_BODY", "Le statut est invalide");
  }
  return value as OfferStatus;
};

const parseOfferBody = (value: unknown) => {
  if (typeof value !== "object" || value === null) {
    throw new HttpError(400, "INVALID_BODY", "Le corps doit être un objet JSON");
  }

  const body = value as Record<string, unknown>;
  const input = {
    companyId: parsePositiveInt(body.companyId, "companyId"),
    depositorContactId: body.depositorContactId === undefined ? null : parseNullablePositiveInt(body.depositorContactId, "depositorContactId"),
    promoterContactId: body.promoterContactId === undefined ? null : parseNullablePositiveInt(body.promoterContactId, "promoterContactId"),
    academicYearId: parsePositiveInt(body.academicYearId, "academicYearId"),
    periodId: parsePositiveInt(body.periodId, "periodId"),
    title: typeof body.title === "string" ? body.title.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    status: body.status === undefined ? undefined : parseOfferStatus(body.status),
  };

  return input;
};

const parseOfferId = (value: string | string[] | undefined): number => {
  if (value === undefined || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_BODY", "L'identifiant de l'offre est invalide");
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "INVALID_BODY", "L'identifiant de l'offre est invalide");
  }
  return id;
};

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    res.json(offersService.listOffers(getCurrentUser(req)).map(toOfferDto));
  });

  router.post("/", authorize(canManageOffer), (req, res) => {
    const payload = parseOfferBody(req.body);
    const offer = offersService.createOffer(getCurrentUser(req), payload);
    res.status(201).json(toOfferDto(offer));
  });

  router.patch("/:id", authorize(canManageOffer), (req, res) => {
    const id = parseOfferId(req.params.id);
    const payload = parseOfferBody(req.body);
    const offer = offersService.updateOffer(getCurrentUser(req), id, payload);
    res.json(toOfferDto(offer));
  });

  router.delete("/:id", authorize(canManageOffer), (req, res) => {
    const id = parseOfferId(req.params.id);
    offersService.removeOffer(getCurrentUser(req), id);
    res.status(204).send();
  });

  router.patch("/:id/status", authorize(canReviewOffers), (req, res) => {
    const id = parseOfferId(req.params.id);
    if (typeof req.body !== "object" || req.body === null || typeof (req.body as Record<string, unknown>).status !== "string") {
      throw new HttpError(400, "INVALID_BODY", "Le corps doit contenir un statut valide");
    }
    const status = parseOfferStatus((req.body as Record<string, unknown>).status);
    const offer = offersService.setOfferStatus(getCurrentUser(req), id, status);
    res.json(toOfferDto(offer));
  });

  return router;
};
