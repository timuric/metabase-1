import { FIRST_COLLECTION_ID } from "e2e/support/cypress_sample_instance_data";
import { restore, sidesheet } from "e2e/support/helpers";

describe("scenarios > collections > sidesheet", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
    cy.intercept("GET", "/api/**/items?pinned_state*").as("getPinnedItems");
    cy.intercept("GET", "/api/collection/tree**").as("getTree");
    cy.intercept("GET", "/api/collection/*/items?**").as("getCollectionItems");
  });

  it("should allow description to be edited in the sidesheet", () => {
    cy.request("PUT", `/api/collection/${FIRST_COLLECTION_ID}`, {
      description: "[link](https://metabase.com)",
    });

    visitRootCollection();
    cy.log("Collection description visible on page");
    const page = cy.findByRole("presentation");
    page.within(() => {
      const textarea = cy.findByTestId("editable-text");
      textarea.should("have.value", "[link](https://metabase.com)");
    });
    const getSidesheetToggle = () =>
      cy.findByTestId("collection-menu").icon("info").click();

    cy.log("Let's edit the description");
    getSidesheetToggle().click();
    sidesheet().within(() => {
      const textarea = cy.findByTestId("editable-text");
      textarea.click();
      cy.type("edited ");
      cy.realPress("Tab");
      cy.findByLabelText("Close").click();
    });

    cy.log("The edited description is visible on the page");
    const pageAfterEdit = cy.findByRole("presentation");
    pageAfterEdit.within(() => {
      const textarea = cy.findByTestId("editable-text");
      textarea.should("have.value", "edited [link](https://metabase.com)");
    });

    cy.log("The edited description is visible in the sidesheet");
    getSidesheetToggle().click();
    sidesheet().within(() => {
      const textarea = cy.findByTestId("editable-text");
      textarea.should("have.value", "edited [link](https://metabase.com)");
    });
  });
});

function visitRootCollection() {
  cy.intercept("GET", "/api/collection/root/items?**").as(
    "fetchRootCollectionItems",
  );

  cy.visit("/collection/root");

  cy.wait(["@fetchRootCollectionItems", "@fetchRootCollectionItems"]);
}
