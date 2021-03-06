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

define(
    [
        "underscore",
        "form2js",
        "i18next",
        "org/forgerock/commons/ui/common/main/AbstractView",
        "org/forgerock/openig/ui/admin/util/FormUtils",
        "org/forgerock/commons/ui/common/main/EventManager",
        "org/forgerock/commons/ui/common/util/Constants"
    ],
    (_,
     form2js,
     i18n,
     AbstractView,
     FormUtils,
     EventManager,
     Constants) => (
        AbstractView.extend(
            {
                element: ".main",
                template: "templates/openig/admin/apps/parts/Capture.html",
                partials: [
                    "templates/openig/admin/common/form/SliderControl.html",
                    "templates/openig/admin/common/form/GroupControl.html"
                ],
                events: {
                    "click #cancel-capture": "cancelClick",
                    "click #submit-capture": "saveClick",
                    "change .checkbox-slider input[type='checkbox']": "onToggleSwitch"
                },
                data: {},
                initialize (options) {
                    this.data = options.parentData;
                },

                render () {
                    const capture = this.findCapture();

                    this.data.controls = [
                        {
                            name: "inboundGroup",
                            controlType: "group",
                            controls: [
                                {
                                    name: "inboundRequest",
                                    value: capture.inbound.request ? "checked" : "",
                                    controlType: "slider"
                                },
                                {
                                    name: "inboundResponse",
                                    value: capture.inbound.response ? "checked" : "",
                                    controlType: "slider"
                                }
                            ]
                        },
                        {
                            name: "outboundGroup",
                            controlType: "group",
                            controls: [
                                {
                                    name: "outboundRequest",
                                    value: capture.outbound.request ? "checked" : "",
                                    controlType: "slider"
                                },
                                {
                                    name: "outboundResponse",
                                    value: capture.outbound.response ? "checked" : "",
                                    controlType: "slider"
                                }
                            ]
                        }
                    ];
                    FormUtils.extendControlsSettings(this.data.controls, {
                        autoTitle: true,
                        autoHint: false,
                        translatePath: "templates.apps.parts.capture.fields",
                        defaultControlType: "edit"
                    });
                    FormUtils.fillPartialsByControlType(this.data.controls);

                    this.parentRender();
                },

                cancelClick (event) {
                    event.preventDefault();
                    this.render();
                },

                saveClick (event) {
                    event.preventDefault();

                    const form = this.$el.find("#capture-form")[0];
                    const content = this.data.appData.get("content");
                    const capture = this.formToCapture(form);
                    if (this.isCaptureEnabled(capture)) {
                        content.capture = capture;
                    } else {
                        delete content.capture;
                    }
                    this.data.appData.save();

                    const submit = this.$el.find("#submit-capture");
                    submit.attr("disabled", true);

                    EventManager.sendEvent(
                        Constants.EVENT_DISPLAY_MESSAGE_REQUEST,
                        {
                            key: "appSettingsSaveSuccess",
                            filter: i18n.t("templates.apps.parts.capture.title")
                        }
                    );
                },

                onToggleSwitch (event) {
                    event.preventDefault();

                    const form = this.$el.find("#capture-form")[0];
                    const submit = this.$el.find("#submit-capture");

                    const capture = this.findCapture();
                    const newCapture = this.formToCapture(form);

                    // If captures are equal: disable the submit button, enable it otherwise
                    submit.attr("disabled", _.isEqual(capture, newCapture));
                },


                isCaptureEnabled (capture) {
                    return capture.inbound.request === true ||
                        capture.inbound.response === true ||
                        capture.outbound.request === true ||
                        capture.outbound.response === true;
                },

                findCapture () {
                    let capture = this.data.appData.get("content/capture");
                    if (!capture) {
                        capture = this.defaultCapture();
                    }
                    return capture;
                },

                defaultCapture () {
                    return {
                        inbound: {
                            request: false,
                            response: false
                        },
                        outbound: {
                            request: false,
                            response: false
                        }
                    };
                },

                formToCapture (form) {
                    const formVal = form2js(form, ".", false);
                    return {
                        inbound: {
                            request: FormUtils.getBoolValue(formVal.inboundRequest),
                            response: FormUtils.getBoolValue(formVal.inboundResponse)
                        },
                        outbound: {
                            request: FormUtils.getBoolValue(formVal.outboundRequest),
                            response: FormUtils.getBoolValue(formVal.outboundResponse)
                        }
                    };
                }
            }
        )
    )
);
