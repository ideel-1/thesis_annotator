import React, { Suspense } from "react";

import ClientAnnotator from "./ClientAnnotator";

export default function Page() {
  return (
    <main className="bg-white text-neutral-900">
      {/* Handles reviewer auth, banner, board portal, comment layer */}
      <Suspense fallback={null}>
        <ClientAnnotator />
      </Suspense>

    </main>
  );
}
