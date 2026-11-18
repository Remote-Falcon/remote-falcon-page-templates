# Remote Falcon Viewer Page Templates

The Viewer Page templates in this repository are used as the default page templates when creating a new Viewer Page in Remote Falcon.

## Templates

`templates.json` lists every template the control panel shows, in display order. The first entry is the picker's default.

| Template | Author | Season |
| --- | --- | --- |
| The OG | Rick Harris | All |
| Purple Halloween | StramMade3D | Halloween |
| Red & White | StramMade3D | Christmas |
| On Air | Jason Toy | All |
| Lumos Light Show | James Vance | All |
| Dynamic Menu | Matt Orelup | All |
| Candy Cane | Jim Pier | Christmas |
| Santa | Jim Pier | Christmas |
| Storybook | Jim Pier | Christmas |
| Pumpkin Patch | Jim Pier | Halloween |
| Witch's Brew | Jim Pier | Halloween |

## Adding a template

1. Add your page as a single HTML file under `templates/`, e.g. `templates/my-template.html`.
2. Add an entry for it to `templates.json` where you want it to appear in the list:

   ```json
   { "file": "my-template.html", "title": "My Template", "author": "Your Name", "season": "christmas" }
   ```

   - `file`, `title` and `author` are required. The control panel shows "`title` by `author`".
   - `season` is optional: `halloween` or `christmas`. Leave it out for an all-season template.
   - `file` and `title` must be unique.
3. Add a row to the table above.
4. Open a pull request. The "Validate templates manifest" check must pass. Run it locally with:

   ```sh
   node scripts/validate-manifest.mjs
   ```

   It fails if `templates.json` is malformed, if an entry points at a file that doesn't exist, if a file in `templates/` has no entry, or if a file or title is listed twice.

Merging to `main` makes the change live: every Remote Falcon control panel picks it up within about 5 minutes, with no platform deploy in between. Reviewing the pull request is the release gate, so preview the template at desktop, tablet and mobile widths before merging.
