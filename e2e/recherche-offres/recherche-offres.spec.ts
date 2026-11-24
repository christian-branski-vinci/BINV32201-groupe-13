import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lucas Dupont", exact: true }).click();

  const offersLink = page.getByRole("link", { name: "Offres", exact: true });
  await expect(offersLink).toBeVisible();
  await offersLink.click();
  await expect(
    page.getByRole("heading", { name: "Offres de stage", exact: true }),
  ).toBeVisible();
});

test("Scénario 1 — recherche par titre ignore la casse et les espaces extérieurs", async ({
  page,
}) => {
  const search = page.getByRole("searchbox", {
    name: "Rechercher par titre",
    exact: true,
  });
  await search.fill("  APPLICATION  ");

  const offerRows = page.getByRole("table").locator("tbody tr");
  await expect(offerRows).toHaveCount(1);
  await expect(
    page.getByRole("cell", {
      name: "Application React de gestion de flotte",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", {
      name: "Migration d'une application vers le cloud",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "API REST de facturation", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Aucune offre ne correspond à la recherche.", { exact: true }),
  ).toHaveCount(0);
});

test("Scénario 2 — rechercher une offre non publiée ne retourne aucun résultat", async ({
  page,
}) => {
  const offerRows = page.getByRole("table").locator("tbody tr");
  await expect(offerRows.first()).toBeVisible();

  const visibleOfferCount = await offerRows.count();
  expect(visibleOfferCount).toBeGreaterThan(0);
  await expect(
    page.getByRole("cell", { name: "Refonte du portail client", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("table").getByRole("cell", { name: "Publiée", exact: true }),
  ).toHaveCount(visibleOfferCount);

  const search = page.getByRole("searchbox", {
    name: "Rechercher par titre",
    exact: true,
  });
  await search.fill("refonte");

  await expect(
    page.getByText("Aucune offre ne correspond à la recherche.", { exact: true }),
  ).toBeVisible();
  await expect(offerRows).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "Refonte du portail client", exact: true }),
  ).toHaveCount(0);
  await expect(search).toHaveValue("refonte");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
});
