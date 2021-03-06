/**
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2016 ForgeRock AS.
 */

define([
    "jquery",
    "underscore",
    "i18next",
    "org/forgerock/commons/ui/common/util/UIUtils",
    "org/forgerock/openig/ui/admin/models/AppsCollection",
    "org/forgerock/openig/ui/admin/models/RoutesCollection",
    "org/forgerock/commons/ui/common/components/BootstrapDialogView",
    "org/forgerock/commons/ui/common/main/EventManager",
    "org/forgerock/commons/ui/common/util/Constants",
    "org/forgerock/openig/ui/admin/services/TransformService",
    "org/forgerock/commons/ui/common/main/Router"
], (
    $,
    _,
    i18n,
    UIUtils,
    AppsCollection,
    RoutesCollection,
    BootstrapDialogView,
    eventManager,
    constants,
    transformService,
    router
) => ({
    cleanAppNamen (name) {
        // TODO: add some checks, fixes
        const clearName = name;
        return clearName;
    },

    checkName (app) {
        const promise = $.Deferred();
        AppsCollection.availableApps().then((apps) => {
            const foundApp = _.find(apps.models, (a) => (
                a.get("content/name") === app.get("content/name")) &&
                a.get("_id") !== app.get("_id")
            );

            if (foundApp) {
                promise.resolve("templates.apps.duplicateNameError");
            } else {
                promise.resolve(true);
            }
        });
        return promise;
    },

    toggleValue (e) {
        const toggle = this.$el.find(e.target);
        if (toggle.val() === "true") {
            toggle.val(false);
        } else {
            toggle.val(true);
        }
    },

    duplicateAppDlg (appId, appTitle) {
        UIUtils.confirmDialog(i18n.t("templates.apps.duplicateDialog", { title: appTitle }), "danger",
            () => {
                router.navigate(`apps/duplicate/${appId}`, true);
            }
        );
    },

    exportConfigDlg (appId) {
        // TODO: call export function
        AppsCollection.byId(appId).then((appData) => {
            if (appData) {
                try {
                    const modal = new BootstrapDialogView();
                    modal.contentTemplate = "templates/openig/admin/modals/ModalMessageTemplate.html";
                    modal.data.jsonContent = JSON.stringify(transformService.transformApplication(appData), null, 2);
                    modal.closeByBackdrop = false;
                    modal.draggable = true;
                    modal.setTitle(i18n.t("common.modalWindow.title.configExport"));
                    modal.loadContent().then(() => {
                        modal.show();
                    });
                } catch (e) {
                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, {
                        key: e.errorType || "modelTransformationFailed", message: e.message
                    });
                }
            }
        });
    },

    deployApplicationModel (model) {
        const deferred = $.Deferred();
        const promise = deferred.promise();
        const appId = model.get("_id");
        const appTitle = model.get("content/name");
        const jsonConfig = transformService.transformApplication(model);
        RoutesCollection.deploy(appId, jsonConfig).done(() => {
            eventManager.sendEvent(
                constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                { key: "appDeployedSuccess", title: appTitle }
            );
            model.set("deployedDate", new Date());
            model.set("pendingChanges", false);
            model.save();
            deferred.resolve();
        }).fail((errorResponse) => {
            let errorMessage;
            if (errorResponse) {
                errorMessage = errorResponse.cause ? errorResponse.cause.message : errorResponse.statusText;
            }
            eventManager.sendEvent(
                constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                { key: "appDeployedFailed", title: appTitle, message: errorMessage }
            );
            deferred.reject();
        });
        return promise;
    },

    deployApplicationDlg (appId, appTitle) {
        const deferred = $.Deferred();
        const promise = deferred.promise();
        AppsCollection.byId(appId).then((appData) => {
            if (appData) {
                const isDeployed = RoutesCollection.isDeployed(appId);
                if (!isDeployed) {
                    this.deployApplicationModel(appData).done(() => {
                        deferred.resolve();
                    }).fail(() => {
                        deferred.reject();
                    });
                } else {
                    UIUtils.confirmDialog(i18n.t("templates.apps.deployDialog", { title: appTitle }), "danger",
                        () => {
                            this.deployApplicationModel(appData).done(() => {
                                deferred.resolve();
                            }).fail(() => {
                                deferred.reject();
                            });
                        });
                }
            }
        });
        return promise;
    },

    undeployApplicationDlg (appId, appTitle) {
        const deferred = $.Deferred();
        const promise = deferred.promise();
        UIUtils.confirmDialog(i18n.t("templates.apps.undeployDialog", { title: appTitle }), "danger",
            () => {
                RoutesCollection.undeploy(appId).done(() => {
                    eventManager.sendEvent(
                        constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                        { key: "appUndeployedSuccess", title: appTitle }
                    );
                    AppsCollection.byId(appId).then((appData) => {
                        appData.set("deployedDate", null);
                        appData.set("pendingChanges", false);
                        appData.save();
                    });
                    deferred.resolve();
                }).fail((errorResponse) => {
                    let errorMessage;
                    if (errorResponse) {
                        errorMessage = errorResponse.cause ? errorResponse.cause.message : errorResponse.statusText;
                    }
                    eventManager.sendEvent(
                        constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                        { key: "appUndeployedFailed", title: appTitle, message: errorMessage }
                    );
                    deferred.reject();
                });
            }
        );
        return promise;
    },

    deleteApplicationDlg (appId, appTitle, deletedCallback) {
        UIUtils.confirmDialog(i18n.t("templates.apps.deleteDialog", { title: appTitle }), "danger",
            () => {
                AppsCollection.removeById(appId);

                eventManager.sendEvent(
                    constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                    { key: "deleteAppSuccess", title: appTitle }
                );

                if (deletedCallback) {
                    deletedCallback();
                }
            }
        );
    },

    addFilterIntoModel (appModel, filter) {
        const content = _.clone(appModel.get("content"));
        const filters = content.filters;
        const orderedFilters = [];
        const newFilterOrder = constants.defaultFiltersOrder[filter.type];
        let filterIncluded = false;
        _.forEach(filters, (f) => {
            let order = constants.defaultFiltersOrder[_.get(f, "type", "Unknown")];
            if (order === undefined) {
                order = constants.defaultFiltersOrder.Unknown;
            }
            if (order > newFilterOrder && !filterIncluded) {
                orderedFilters.push(filter);
                filterIncluded = true;
            }
            orderedFilters.push(f);
        });
        if (!filterIncluded) {
            orderedFilters.push(filter);
        }
        content.filters = orderedFilters;
        appModel.set("content", content);
    }
})
);
