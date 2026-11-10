import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { APPLICATION, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestDatabase } from "./helpers/testDatabase.ts";
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
    expect(
      response.body.map((application: { id: number }) => application.id),
    ).toEqual([APPLICATION.INES_FLEET_APP, APPLICATION.INES_BILLING_API]);
  });

  it("accepte une candidature avec un message normalisé", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO))
      .send({
        offerId: OFFER.INTERNAL_CHATBOT,
        message: "  Sujet très intéressant  ",
      });

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
    expect(duplicate.body.error.code).toBe("INVALID_BODY");
    expect(unpublished.status).toBe(400);
    expect(unpublished.body.error.code).toBe("INVALID_BODY");
  });

  it("retire une candidature en cours et conserve ce statut dans la liste", async () => {
    const withdrawal = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", studentToken(STUDENT.LUCAS_DUPONT));
    const list = await request(app)
      .get("/applications")
      .set("Authorization", studentToken(STUDENT.LUCAS_DUPONT));

    expect(withdrawal.status).toBe(200);
    expect(withdrawal.body.status).toBe("WITHDRAWN");
    expect(list.body).toEqual([
      expect.objectContaining({
        id: APPLICATION.LUCAS_FLEET_APP,
        status: "WITHDRAWN",
      }),
    ]);
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
    expect(
      list.body.map((application: { status: string }) => application.status),
    ).toContain("WITHDRAWN");
    expect(
      list.body.map((application: { status: string }) => application.status),
    ).toContain("IN_PROGRESS");
  });

  it("refuse le retrait d'une candidature non retenue et l'accès d'un autre étudiant", async () => {
    const rejected = await request(app)
      .delete(`/applications/${APPLICATION.LEA_CLOUD_MIGRATION}`)
      .set("Authorization", studentToken(STUDENT.LEA_MERTENS));
    const otherStudent = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", studentToken(STUDENT.INES_HADDAD));

    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe("INVALID_BODY");
    expect(otherStudent.status).toBe(404);
    expect(otherStudent.body.error.code).toBe("NOT_FOUND");
  });

  it("retourne chaque statut de candidature uniquement à l'étudiant concerné", async () => {
    const cases = [
      [
        STUDENT.INES_HADDAD,
        [APPLICATION.INES_FLEET_APP, APPLICATION.INES_BILLING_API],
        ["IN_PROGRESS", "WITHDRAWN"],
      ],
      [
        STUDENT.MATEUSZ_KOWALSKI,
        [APPLICATION.MATEUSZ_CLOUD_MIGRATION],
        ["SELECTED"],
      ],
      [STUDENT.LEA_MERTENS, [APPLICATION.LEA_CLOUD_MIGRATION], ["REJECTED"]],
    ] as const;

    for (const [studentId, expectedIds, expectedStatuses] of cases) {
      const response = await request(app)
        .get("/applications")
        .set("Authorization", studentToken(studentId));

      expect(response.status).toBe(200);
      expect(
        response.body
          .map((application: { id: number }) => application.id)
          .sort(),
      ).toEqual([...expectedIds].sort());
      expect(
        response.body
          .map((application: { status: string }) => application.status)
          .sort(),
      ).toEqual([...expectedStatuses].sort());
    }
  });

  it("exclut de la liste une candidature liée à une année académique ancienne", async () => {
    const db = createTestDatabase();
    db.prepare(
      `INSERT INTO applications (offer_id, student_id, message, status, applied_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      OFFER.PDF_REPORTS,
      STUDENT.DMYTRO_KOVALENKO,
      null,
      "IN_PROGRESS",
      "2025-10-01 10:00:00",
    );
    app = createTestApp(db);

    const response = await request(app)
      .get("/applications")
      .set("Authorization", studentToken(STUDENT.DMYTRO_KOVALENKO));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
