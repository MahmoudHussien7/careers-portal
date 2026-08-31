"use client";

import { use } from "react";
import { ProfileDetailView } from "../../_components/ProfileDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CareersProfileDetailPage({ params }: Props) {
  const { id } = use(params);
  return <ProfileDetailView recruiterId={id} />;
}
