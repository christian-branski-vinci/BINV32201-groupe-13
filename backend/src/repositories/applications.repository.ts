import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";

const APPLICATION_SELECT = `
  SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
         ay.label AS academic_year_label, p.code AS period_code, a.student_id,
         a.message, a.status, a.applied_at
  FROM applications a
  JOIN offers o ON o.id = a.offer_id
  JOIN companies c ON c.id = o.company_id
  JOIN academic_years ay ON ay.id = o.academic_year_id
  JOIN periods p ON p.id = o.period_id
`;

export const createApplicationsRepository = (db: Db) => {
  const findAllByStudent = db.prepare<[number], ApplicationDbo>(`
    ${APPLICATION_SELECT}
    WHERE a.student_id = ?
      AND ay.is_current = 1
    ORDER BY ay.start_date DESC, a.applied_at DESC, a.id DESC
  `);
  const findById = db.prepare<[number], ApplicationDbo>(`
    ${APPLICATION_SELECT}
    WHERE a.id = ?
  `);
  const findActiveForOffer = db.prepare<[number, number], { id: number }>(`
    SELECT id FROM applications
    WHERE offer_id = ? AND student_id = ? AND status <> 'WITHDRAWN'
    LIMIT 1
  `);
  const offerIsPublished = db.prepare<[number], { id: number }>(
    "SELECT id FROM offers WHERE id = ? AND status = 'PUBLISHED'",
  );
  const insertApplication = db.prepare<{
    offer_id: number;
    student_id: number;
    message: string | null;
  }, { lastInsertRowid: number }>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offer_id, @student_id, @message)
  `);
  const withdrawApplication = db.prepare<[number, number], unknown>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = ? AND student_id = ? AND status IN ('IN_PROGRESS', 'SELECTED')
  `);
  const getCurrentAcademicYear = db.prepare<[], { label: string }>(
    "SELECT label FROM academic_years WHERE is_current = 1",
  );

  return {
    findAllByStudent: (studentId: number): ApplicationDbo[] => findAllByStudent.all(studentId),
    findById: (id: number): ApplicationDbo | undefined => findById.get(id),
    offerIsPublished: (offerId: number): boolean => offerIsPublished.get(offerId) !== undefined,
    hasActiveForOffer: (offerId: number, studentId: number): boolean =>
      findActiveForOffer.get(offerId, studentId) !== undefined,
    create: (offerId: number, studentId: number, message: string | null): ApplicationDbo => {
      const result = insertApplication.run({ offer_id: offerId, student_id: studentId, message });
      const created = findById.get(Number(result.lastInsertRowid));
      if (created === undefined) throw new Error("Impossible de récupérer la candidature créée");
      return created;
    },
    withdraw: (id: number, studentId: number): ApplicationDbo | undefined => {
      withdrawApplication.run(id, studentId);
      return findById.get(id);
    },
    currentAcademicYear: (): string | undefined => getCurrentAcademicYear.get()?.label,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
