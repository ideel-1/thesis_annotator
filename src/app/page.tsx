import React, { Suspense } from "react";

import ClientAnnotator from "./ClientAnnotator";
import ContextSection from "@/components/ContextSection";
import ContentSection from "@/components/ContentSection";
import CommunicationSection from "@/components/CommunicationSection";

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
