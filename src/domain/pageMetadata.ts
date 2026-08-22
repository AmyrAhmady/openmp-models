import { animationLibraries } from './animationCatalog';
import { MODEL_TYPE_LABELS } from './modelType';
import type { CatalogItem } from './catalog';
import type { ShareableUrlState } from './shareableUrl';

export interface PageMetadata {
    title: string;
    description: string;
}

const siteTitle = 'open.mp | Model Library';

export function getPageMetadata(
    state: ShareableUrlState,
    hasQuery: boolean,
    item: CatalogItem | null
): PageMetadata {
    if (!hasQuery) {
        return {
            title: siteTitle,
            description: 'Explore the Open Multiplayer model library.',
        };
    }

    const categoryLabel = MODEL_TYPE_LABELS[state.modelType];
    const title = item
        ? `${siteTitle} | ${categoryLabel} | ${item.name} (${item.id})`
        : `${siteTitle} | ${categoryLabel}`;

    if (!item) {
        return {
            title,
            description: `Browse ${categoryLabel.toLowerCase()} in the Open Multiplayer model library.`,
        };
    }

    if (state.modelType === 'skin' && state.animationLibraryId && state.animationName) {
        const libraryName =
            animationLibraries.find(
                (library) => library.id.toLowerCase() === state.animationLibraryId?.toLowerCase()
            )?.name ?? state.animationLibraryId;

        return {
            title,
            description: `The ${item.name} skin playing ${libraryName}:${state.animationName} animation.`,
        };
    }

    return {
        title,
        description: `Explore the ${item.name} model (ID ${item.id}) in the Open Multiplayer ${categoryLabel.toLowerCase()} library.`,
    };
}
