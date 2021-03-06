const { Criteria } = Shopware.Data;

export default {
    namespaced: true,

    state() {
        return {
            landingPage: null,
            category: null,
            customFieldSets: [],
            landingPagesToDelete: undefined,
            categoriesToDelete: undefined
        };
    },

    mutations: {
        setActiveLandingPage(state, { landingPage }) {
            state.landingPage = landingPage;
        },

        setActiveCategory(state, { category }) {
            state.category = category;
        },

        setCustomFieldSets(state, newCustomFieldSets) {
            state.customFieldSets = newCustomFieldSets;
        },

        setLandingPagesToDelete(state, { landingPagesToDelete }) {
            state.landingPagesToDelete = landingPagesToDelete;
        },

        setCategoriesToDelete(state, { categoriesToDelete }) {
            state.categoriesToDelete = categoriesToDelete;
        }
    },

    actions: {
        setActiveLandingPage({ commit }, payload) {
            commit('setActiveLandingPage', payload);
        },

        loadActiveLandingPage({ commit }, { repository, id, apiContext }) {
            if (id === 'create') {
                const landingPage = repository.create(apiContext);
                landingPage.cmsPageId = null;
                commit('setActiveLandingPage', { landingPage });
                return Promise.resolve();
            }

            const criteria = new Criteria();

            criteria.addAssociation('tags');
            criteria.addAssociation('salesChannels');

            return repository.get(id, apiContext, criteria).then((landingPage) => {
                commit('setActiveLandingPage', { landingPage });
            });
        },

        setActiveCategory({ commit }, payload) {
            commit('setActiveCategory', payload);
        },

        loadActiveCategory({ commit }, { repository, id, apiContext }) {
            const criteria = new Criteria();

            criteria.getAssociation('seoUrls')
                .addFilter(Criteria.equals('isCanonical', true));

            criteria.addAssociation('tags')
                .addAssociation('media')
                .addAssociation('navigationSalesChannels')
                .addAssociation('serviceSalesChannels')
                .addAssociation('footerSalesChannels');

            if (Shopware.Feature.isActive('FEATURE_NEXT_13504')) {
                criteria.addAssociation('navigationSalesChannels.homeCmsPage.previewMedia');
            }

            return repository.get(id, apiContext, criteria).then((category) => {
                category.isColumn = false;
                if (category.parentId !== null && Shopware.Feature.isActive('FEATURE_NEXT_13504')) {
                    const parentCriteria = new Criteria();
                    parentCriteria.addAssociation('footerSalesChannels');
                    repository.get(category.parentId, apiContext, parentCriteria).then((parent) => {
                        category.parent = parent;

                        category.isColumn = category.parent !== undefined
                            && category.parent.footerSalesChannels !== undefined
                            && category.parent.footerSalesChannels.length !== 0;

                        commit('setActiveCategory', { category });
                    });

                    return;
                }

                commit('setActiveCategory', { category });
            });
        }
    }
};
