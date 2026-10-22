import type { Db } from "../db/database.ts";
import type { OfferDbo, OfferStatus } from "../models/offer.ts";

export interface OfferFilter {
  /** Limite aux offres de ce statut. */
  status?: OfferStatus;
  /** Limite aux offres déposées par ce contact. */
  depositorContactId?: number;
}

export interface OfferInput {
  companyId: number;
  depositorContactId: number | null;
  promoterContactId: number | null;
  academicYearId: number;
  periodId: number;
  title: string;
  description: string;
  status?: OfferStatus;
}

interface FindAllParams {
  status: OfferStatus | null;
  depositorContactId: number | null;
}

export const createOffersRepository = (db: Db) => {
  const findAll = db.prepare<FindAllParams, OfferDbo>(`
    SELECT o.id, o.title, o.description, o.status,
           o.company_id, c.short_name AS company_short_name,
           o.depositor_contact_id,
           ay.label AS academic_year_label, p.code AS period_code,
           o.created_at, o.updated_at
    FROM offers o
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE (@status IS NULL OR o.status = @status)
      AND (@depositorContactId IS NULL OR o.depositor_contact_id = @depositorContactId)
    ORDER BY ay.start_date DESC, o.created_at DESC
  `);

  const findById = db.prepare<[number], OfferDbo>(`
    SELECT o.id, o.title, o.description, o.status,
           o.company_id, c.short_name AS company_short_name,
           o.depositor_contact_id,
           ay.label AS academic_year_label, p.code AS period_code,
           o.created_at, o.updated_at
    FROM offers o
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE o.id = ?
  `);

  const insertOffer = db.prepare<
    {
      company_id: number;
      depositor_contact_id: number | null;
      promoter_contact_id: number | null;
      academic_year_id: number;
      period_id: number;
      title: string;
      description: string;
      status: OfferStatus;
    },
    { lastInsertRowid: number }
  >(`
    INSERT INTO offers (
      company_id, depositor_contact_id, promoter_contact_id,
      academic_year_id, period_id, title, description, status
    ) VALUES (
      @company_id, @depositor_contact_id, @promoter_contact_id,
      @academic_year_id, @period_id, @title, @description, @status
    )
  `);

  const updateOffer = db.prepare<
    {
      company_id: number;
      depositor_contact_id: number | null;
      promoter_contact_id: number | null;
      academic_year_id: number;
      period_id: number;
      title: string;
      description: string;
      status: OfferStatus;
      id: number;
    },
    unknown
  >(`
    UPDATE offers
    SET company_id = @company_id,
        depositor_contact_id = @depositor_contact_id,
        promoter_contact_id = @promoter_contact_id,
        academic_year_id = @academic_year_id,
        period_id = @period_id,
        title = @title,
        description = @description,
        status = @status,
        updated_at = datetime('now')
    WHERE id = @id
  `);

  const updateStatus = db.prepare<
    { status: OfferStatus; id: number },
    unknown
  >(`
    UPDATE offers
    SET status = @status,
        updated_at = datetime('now')
    WHERE id = @id
  `);

  const deleteOffer = db.prepare<[number], unknown>("DELETE FROM offers WHERE id = ?");

  const hasInternship = db.prepare<[number], { count: number }>(
    "SELECT COUNT(*) AS count FROM internships WHERE offer_id = ?",
  );

  return {
    /** Offres correspondant au filtre, de la plus récente année à la plus ancienne. */
    findAll: ({ status, depositorContactId }: OfferFilter): OfferDbo[] =>
      findAll.all({ status: status ?? null, depositorContactId: depositorContactId ?? null }),

    findById: (id: number): OfferDbo | undefined => findById.get(id),

    create: (input: OfferInput): OfferDbo => {
      const result = insertOffer.run({
        company_id: input.companyId,
        depositor_contact_id: input.depositorContactId,
        promoter_contact_id: input.promoterContactId,
        academic_year_id: input.academicYearId,
        period_id: input.periodId,
        title: input.title,
        description: input.description,
        status: input.status ?? "SUBMITTED",
      });
      const created = findById.get(Number(result.lastInsertRowid));
      if (created === undefined) throw new Error("Impossible de récupérer l'offre créée");
      return created;
    },

    update: (id: number, input: OfferInput): OfferDbo | undefined => {
      updateOffer.run({
        id,
        company_id: input.companyId,
        depositor_contact_id: input.depositorContactId,
        promoter_contact_id: input.promoterContactId,
        academic_year_id: input.academicYearId,
        period_id: input.periodId,
        title: input.title,
        description: input.description,
        status: input.status ?? "SUBMITTED",
      });
      return findById.get(id);
    },

    updateStatus: (id: number, status: OfferStatus): OfferDbo | undefined => {
      updateStatus.run({ id, status });
      return findById.get(id);
    },

    delete: (id: number): boolean => deleteOffer.run(id).changes > 0,

    hasLinkedInternship: (id: number): boolean => (hasInternship.get(id)?.count ?? 0) > 0,
  };
};

export type OffersRepository = ReturnType<typeof createOffersRepository>;
