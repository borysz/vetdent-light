/**
 * Load (or remove) the demo animals Max (dog) and Mici (cat) in a clinic:
 *
 *   npm run seed:demo                       add them to the oldest clinic (re-running adds nothing twice)
 *   npm run seed:demo -- --clinic "Name"    add them to the clinic with that name
 *   npm run seed:demo -- --reset            remove them again (their sheets go with them)
 *
 * The clinic's empty letterhead fields are filled with neutral demo data; fields that are set stay as they are.
 */
import { createAdminClient } from "../src/server/admin";
import { fillDemoClinic, insertDemoAnimals, removeDemoAnimals } from "./lib/demo";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const admin = createAdminClient();
  const name = arg("clinic");
  const query = admin.from("clinics").select("id, name").order("created_at", { ascending: true }).limit(1);
  const clinics = await (name ? query.eq("name", name) : query);
  if (clinics.error) throw clinics.error;
  const clinic = clinics.data[0];
  if (!clinic) throw new Error(name ? `No clinic named "${name}".` : "There is no clinic yet: create a user first (npm run user:create).");

  if (process.argv.includes("--reset")) {
    console.log(`Removed ${await removeDemoAnimals(admin, clinic.id)} demo animal(s) from "${clinic.name}".`);
    return;
  }
  await fillDemoClinic(admin, clinic.id);
  const created = await insertDemoAnimals(admin, clinic.id);
  console.log(created.length === 0 ? `The demo animals are already in "${clinic.name}".` : `Added to "${clinic.name}": ${created.map((c) => c.name).join(", ")}.`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
