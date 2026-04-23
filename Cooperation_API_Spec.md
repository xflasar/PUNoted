# Cooperation Page - API & WebSocket Specification

This document outlines the API endpoints and WebSocket events required by the Cooperation Page frontend. Currently, the frontend is configured to use mock data for development purposes, but it expects the following endpoints to be implemented on the backend.

## Base URLs
- **REST API:** `https://api.punoted.net/groups` (and `/map`, `/materials`)
- **WebSocket:** `wss://api.punoted.net/groups/ww/{groupId}/{userId}?token={authToken}`

---

## 1. REST API Endpoints

### 1.1. Fetch All Groups
- **Endpoint:** `GET /groups`
- **Headers:** `Authorization: Bearer {authToken}`
- **Description:** Retrieves all groups the user is a member of (both active and pending invitations).
- **Response (200 OK):** `FullGroupData[]`
  ```json
  [
    {
      "id": "group_123",
      "name": "My Production Group",
      "ownerId": "user_456",
      "members": [
        { "uid": "user_456", "username": "OwnerUser", "displayName": "Owner", "role": "owner" }
      ],
      "updated_at": "2026-04-18T10:00:00Z",
      "isPending": false
    }
  ]
  ```

### 1.2. Create Group
- **Endpoint:** `POST /groups`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `Group` (minimal group object)
  ```json
  {
    "name": "New Group",
    "ownerId": "user_456"
  }
  ```
- **Response (200/201):** `{ "group": Group }` (The newly created group with generated `id`)

### 1.3. Save Chain Data
- **Endpoint:** `POST /groups/{groupId}/save_chain`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `{ "chain_data": Chain }`
- **Response (200 OK):** `{ "message": "Saved", "new_updated_at": "2026-04-18T10:05:00Z" }`

### 1.4. Delete Group
- **Endpoint:** `DELETE /groups/{groupId}`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `{ "user_id": "user_456" }`
- **Response:** `204 No Content`

### 1.5. Change User Role
- **Endpoint:** `PUT /groups/{groupId}/members/{memberId}/role`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `{ "new_role": "editor" | "viewer" }`
- **Response:** `200 OK`

### 1.6. Remove Member
- **Endpoint:** `DELETE /groups/{groupId}/member`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `{ "member_uid": "user_789" }`
- **Response:** `200 OK`

### 1.7. Invite User
- **Endpoint:** `POST /groups/{groupId}/invite`
- **Headers:** `Authorization: Bearer {authToken}`, `Content-Type: application/json`
- **Body:** `{ "invitee_uid": "user_999", "role": "viewer" }`
- **Response:** `200 OK`

### 1.8. Accept / Reject Invite
- **Endpoint:** `POST /groups/{groupId}/invite/accept` (or `/reject`)
- **Headers:** `Authorization: Bearer {authToken}`
- **Response:** `200 OK`

### 1.9. Fetch All Users (for inviting)
- **Endpoint:** `GET /groups/all_users`
- **Headers:** `Authorization: Bearer {authToken}`
- **Response:** Array of user objects `{ "uid": "...", "username": "...", "displayName": "..." }`

### 1.10. Live Node Data (Flows & Storage)
- **Endpoint:** `GET /groups/{groupId}/live-node-data?planet_id={planetId}&material={ticker}`
- **Headers:** `Authorization: Bearer {authToken}`
- **Response:** `{ "userFlows": [...], "userStorage": [...] }`

### 1.11. Planets Search
- **Endpoint:** `GET /map/planets/search?query={search_term}`
- **Response:** Array of `SearchResultPlanet` objects.

### 1.12. Materials Data
- **Endpoint:** `GET (or POST) /materials`
- **Response:** `{ "data": [ Material objects ] }`

---

## 2. WebSocket Protocol

**Connection URL:** `ww/{groupId}/{userId}?token={authToken}`

### Client -> Server Messages
All messages sent by the client follow this structure:
```json
{
  "type": "MESSAGE_TYPE",
  "userId": "sender_uid",
  "payload": { ... }
}
```
**Types sent by Client:**
- `INITIAL_LOAD_REQUEST`: Requests the initial chain state.
- `NODE_MOVE`: Broadcasts node movement (dragging).
- `EDGE_UPDATE`: Broadcasts new/removed connections.
- `CURSOR_MOVE`: Broadcasts mouse cursor position (`x`, `y`, `userDisplayName`).
- `NODE_LOCKED` / `NODE_UNLOCK`: Signals a user is editing a node.

### Server -> Client Messages
**Types expected by Client:**
- `INITIAL_LOAD_REQUEST` (Response): `{ "type": "INITIAL_LOAD_REQUEST", "payload": { "chain": Chain } }`
- `FULL_CHAIN_STATE`: Completely replaces the client's chain.
- `CHAIN_UPDATE`: Granular chain update.
- `NODE_MOVE`: Received from other users dragging a node.
- `NODE_UPDATE` / `NODE_ADD` / `NODE_REMOVE`: Granular node modifications.
- `EDGE_UPDATE`: Granular edge modifications.
- `GROUP_MEMBER_UPDATE`: Notification that members/roles changed.
- `NODE_LOCKED` / `NODE_LOCK_DENIED` / `NODE_UNLOCK`: Syncing edit locks.
- `CURSOR_MOVE`: Received from other users' mice.
- `GROUP_INVITE`: Notification of a new group invite.
- `USER_LEAVE`: Notification that another user disconnected.
