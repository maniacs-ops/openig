/*
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
 * information: "Portions Copyright [year] [name of copyright owner]".
 *
 * Copyright 2009 Sun Microsystems Inc.
 * Portions Copyright 2010-2011 ApexIdentity Inc.
 * Portions Copyright 2011-2015 ForgeRock AS.
 */

package org.forgerock.openig.http;

import java.net.URI;
import java.security.Principal;

import org.forgerock.http.ClientInfo;
import org.forgerock.http.Context;
import org.forgerock.http.Session;
import org.forgerock.http.protocol.Request;
import org.forgerock.http.protocol.Response;
import org.forgerock.openig.util.ExtensibleFieldMap;
import org.forgerock.util.Reject;

/**
 * An HTTP exchange of request and response, and the root object for the exchange object model.
 * The exchange object model parallels the document object model, exposing elements of the
 * exchange. It supports this by exposing its fixed attributes and allowing arbitrary
 * attributes via its {@code ExtensibleFieldMap} superclass.
 * <p>
 * The contract of an exchange is such that it is the responsibility of the caller of a
 * {@link org.forgerock.http.Handler} object to create and populate the request object,
 * and responsibility of the handler to create and populate the response object.
 * <p>
 * If an existing response object exists in the exchange and the handler intends to replace
 * it with another response object, it must first check to see if the existing response
 * object has an entity, and if it does, must call its {@code close} method in order to signal
 * that the processing of the response from a remote server is complete.
 */
public class Exchange extends ExtensibleFieldMap implements Context {

    /**
     * The original message's URI, as received by the web container. This value is set by the receiving servlet and
     * is immutable.
     */
    private final URI originalUri;

    private final Context parent;

    /**
     * Builds a new Exchange without any originalUri value (will be {@code null}) and no parent context.
     */
    public Exchange() {
        this(null, null);
    }

    /**
     * Builds a new Exchange with the given originalUri value (can be {@code null}).
     *
     * @param originalUri
     *            original message's URI, as received by the web container
     * @param parent
     *            the parent context, can be null.
     */
    public Exchange(final Context parent, final URI originalUri) {
        this.originalUri = originalUri;
        this.parent = parent;
    }

    @Override
    public String getContextName() {
        return "exchange";
    }

    @Override
    public final <T extends Context> T asContext(final Class<T> clazz) {
        Reject.ifNull(clazz, "clazz cannot be null");
        T context = asContext0(clazz);
        if (context != null) {
            return context;
        } else {
            throw new IllegalArgumentException("No context of type " + clazz.getName() + " found.");
        }
    }

    @Override
    public final Context getContext(final String contextName) {
        Context context = getContext0(contextName);
        if (context != null) {
            return context;
        } else {
            throw new IllegalArgumentException("No context of named " + contextName + " found.");
        }
    }

    private <T extends Context> T asContext0(final Class<T> clazz) {
        for (Context context = this; context != null; context = context.getParent()) {
            final Class<?> contextClass = context.getClass();
            if (clazz.isAssignableFrom(contextClass)) {
                return contextClass.asSubclass(clazz).cast(context);
            }
        }
        return null;
    }

    private Context getContext0(final String contextName) {
        for (Context context = this; context != null; context = context.getParent()) {
            if (context.getContextName().equals(contextName)) {
                return context;
            }
        }
        return null;
    }

    @Override
    public boolean containsContext(final Class<? extends Context> clazz) {
        return asContext(clazz) != null;
    }

    @Override
    public boolean containsContext(final String contextName) {
        return getContext(contextName) != null;
    }

    @Override
    public String getId() {
        return getParent().getId();
    }

    @Override
    public Context getParent() {
        return parent;
    }

    @Override
    public boolean isRootContext() {
        return false;
    }

    /**
     * Returns the request portion of the HTTP exchange.
     *
     * @return the request
     */
    public Request getRequest() {
        return (Request) get("request");
    }

    /**
     * Sets the request portion of the HTTP exchange.
     *
     * @param request the request to set
     */
    public void setRequest(Request request) {
        put("request", request);
    }

    /**
     * Returns the response portion of the HTTP exchange.
     *
     * @return the response
     */
    public Response getResponse() {
        return (Response) get("response");
    }

    /**
     * Sets the response portion of the HTTP exchange.
     *
     * @param response the response to set
     */
    public void setResponse(Response response) {
        put("response", response);
    }

    /**
     * The principal associated with the request, or {@code null} if unknown.
     *
     * @return the principal
     */
    public Principal getPrincipal() {
        return (Principal) get("principal");
    }

    /**
     * Sets the principal associated with the request.
     *
     * @param principal the principal to set
     */
    public void setPrincipal(Principal principal) {
        put("principal",  principal);
    }

    /**
     * Self-referential value to make this the root object in the exchange object model.
     *
     * @return the exchange
     */
    public Exchange getExchange() {
        return this;
    }

    /**
     * Session context associated with the remote client.
     *
     * @return the session
     */
    public Session getSession() {
        return (Session) get("session");
    }

    /**
     * Sets the session context associated with the remote client.
     *
     * @param session the session to set
     */
    public void setSession(Session session) {
        put("session", session);
    }

    /**
     * The info we can obtain from the client from this request.
     *
     * @return the clientInfo
     */
    public ClientInfo getClientInfo() {
        return (ClientInfo) get("clientInfo");
    }

    /**
     * Sets the clientInfo.
     *
     * @param clientInfo the clientInfo to set
     */
    public void setClientInfo(ClientInfo clientInfo) {
        put("clientInfo", clientInfo);
    }

    /**
     * The original message's URI, as received by the web container. This value is set by the receiving servlet and
     * is immutable.
     *
     * @return the originalUri
     */
    public URI getOriginalUri() {
        return originalUri;
    }
}
