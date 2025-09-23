"use client";
import { FilterCarousel } from "@/components/filter-carousel";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface CategoriesSectionProps {
  categoryId?: string;
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<div>Loading categories...</div>}>
      <ErrorBoundary fallback={<div>Error loading categories</div>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  // en cualquiera que use useSuspenseQuery tengo que envolverlo con <Suspense> y <ErrorBoundary>
  const [categories] = trpc.categories.getMany.useSuspenseQuery();

  const data = categories.map((cat) => ({ value: cat.id, label: cat.name }));

  if (data.length === 0) return null;
  console.log(data);

  return <FilterCarousel value={categoryId} data={data} />;
};

export default CategoriesSection;
