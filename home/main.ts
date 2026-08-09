// Home page script: the share dialog is all there is to wire, plus the i18n boot.
import { wireShareDialog } from "../shared/share-dialog";
import { initI18n, bootI18n, applyTranslations } from "../shared/i18n";
import { bootTheme } from "../shared/theme";
import { showBeginnerBanner } from "../shared/beginner";
import { MAX_FILE_LABEL } from "../shared/protocol";
import { MAX_SNIPPET_LABEL } from "../shared/snippet";

initI18n({ maxFile: MAX_FILE_LABEL, maxSnippet: MAX_SNIPPET_LABEL });
bootI18n();
bootTheme();
showBeginnerBanner("beginner.home");

document.getElementById("share-open")!.addEventListener("click", wireShareDialog());

// Re-render the share dialog copy when the language changes.
window.addEventListener("langchange", () => applyTranslations(document.getElementById("share-dialog")!));
