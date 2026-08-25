import type { GetServerSideProps, NextPage } from 'next';
import Main, { type MainProps } from './index';
import { findCatalogItem } from 'src/catalog/catalogRegistry';
import { getPageMetadata } from 'src/domain/pageMetadata';
import { parseShareableUrl } from 'src/domain/shareableUrl';

const ModelsPage: NextPage<MainProps> = (props) => <Main {...props} forceLibrary />;

export const getServerSideProps: GetServerSideProps<MainProps> = async ({ resolvedUrl }) => {
    const queryStart = resolvedUrl.indexOf('?');
    const search = queryStart === -1 ? '' : resolvedUrl.slice(queryStart);
    const state = parseShareableUrl(search);
    const item = state.modelId === null ? null : findCatalogItem(state.modelType, state.modelId);

    return {
        props: {
            initialMetadata: getPageMetadata(state, true, item ?? null),
        },
    };
};

export default ModelsPage;
