import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { authorize } from "../middlewares/authorize.ts";
import { isStudent } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const parsePositiveInt = (value: string | string[] | undefined, field: string): number => {
  if (value === undefined || Array.isArray(value) || !/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, "INVALID_BODY", `L'identifiant ${field} est invalide`);
  }
  return Number(value);
};

const parseCreateBody = (body: unknown): { offerId: number; message: string | null } => {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "INVALID_BODY", "Le corps doit être un objet JSON");
  }
  const input = body as Record<string, unknown>;
  if (typeof input.offerId !== "number" || !Number.isInteger(input.offerId) || input.offerId <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }
  if (input.message !== undefined && input.message !== null && typeof input.message !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne ou null");
  }
  return { offerId: input.offerId, message: input.message === undefined ? null : input.message as string | null };
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();
  const studentOnly = authorize(isStudent);

  router.get("/", studentOnly, (req, res) => {
    res.json(applicationsService.listApplications(getCurrentUser(req)).map(toApplicationDto));
  });

  router.post("/", studentOnly, (req, res) => {
    const input = parseCreateBody(req.body);
    const application = applicationsService.createApplication(getCurrentUser(req), input.offerId, input.message);
    res.status(201).json(toApplicationDto(application));
  });

  router.delete("/:id", studentOnly, (req, res) => {
    const application = applicationsService.withdrawApplication(
      getCurrentUser(req),
      parsePositiveInt(req.params.id, "candidature"),
    );
    res.json(toApplicationDto(application));
  });

  return router;
};
