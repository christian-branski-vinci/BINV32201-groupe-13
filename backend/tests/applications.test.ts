import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { APPLICATION, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const studentToken = (id: number) => tokenFor("STUDENT", id);

describe("candidatures étudiant", () => {
  it("liste uniquement les candidatures de l'étudiant connecté", async () => {
    const response = await request(app)
      .get("/applications")
      .set("Authorization", studentToken(STUDENT.INES_HADDAD));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((application: { id: number }) => application.id)).toEqual([
      APPLICATION.INES_FLEET_APP,
      APPLICATION.INES_BILLING_API,
    ]);
  });

  it("accepte une candidature avec un message normalisé", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO))
      .send({ offerId: OFFER.INTERNAL_CHATBOT, message: "  Sujet très intéressant  " });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
    expect(response.body.message).toBe("Sujet très intéressant");
  });

  it("refuse les doublons actifs et les offres non publiées", async () => {
    const duplicate = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.LUCAS_DUPONT))
      .send({ offerId: OFFER.FLEET_APP });
    const unpublished = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO))
      .send({ offerId: OFFER.CLIENT_PORTAL });

    expect(duplicate.status).toBe(400);
    expect(unpublished.status).toBe(400);
  });

  it("retire une candidature retenue sans modifier l'offre", async () => {
    const withdrawal = await request(app)
      .delete(`/applications/${APPLICATION.MATEUSZ_CLOUD_MIGRATION}`)
      .set("Authorization", studentToken(STUDENT.MATEUSZ_KOWALSKI));
    expect(withdrawal.status).toBe(200);
    expect(withdrawal.body.status).toBe("WITHDRAWN");
  });

  it("conserve l'historique et permet de recandidater après un retrait", async () => {
    const first = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO))
      .send({ offerId: OFFER.INTERNAL_CHATBOT });
    const withdrawal = await request(app)
      .delete(`/applications/${first.body.id}`)
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO));
    const reapply = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO))
      .send({ offerId: OFFER.INTERNAL_CHATBOT });
    const list = await request(app)
      .get("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO));

    expect(first.status).toBe(201);
    expect(withdrawal.body.status).toBe("WITHDRAWN");
    expect(reapply.status).toBe(201);
    expect(list.body.map((application: { status: string }) => application.status)).toContain("WITHDRAWN");
    expect(list.body.map((application: { status: string }) => application.status)).toContain("IN_PROGRESS");
  });

  it("refuse le retrait d'une candidature non retenue et l'accès d'un autre étudiant", async () => {
    const rejected = await request(app)
      .delete(`/applications/${APPLICATION.LEA_CLOUD_MIGRATION}`)
      .set("Authorization", studentToken(STUDENT.LEA_MERTENS));
    const otherStudent = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", studentToken(STUDENT.INES_HADDAD));

    expect(rejected.status).toBe(400);
    expect(otherStudent.status).toBe(404);
  });
});
