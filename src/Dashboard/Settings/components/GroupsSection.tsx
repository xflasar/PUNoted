import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  DialogContentText,
  Autocomplete,
  CircularProgress,
  IconButton,
  Switch,
  Tooltip,
  InputAdornment,
  useTheme,
} from "@mui/material";
import {
  Groups as GroupsIcon,
  Add as AddIcon,
  NotificationsActive,
  CheckCircleOutline,
  DeleteForever,
  VpnKey,
  Key,
  ContentCopy,
  PersonAdd,
  RemoveCircle as LeaveIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type { Group, GroupMember } from "../types";
import { API_BASE, dataGroupsGuideSteps, MASTER_PERMISSIONS } from "../constants"
import { SectionHeader, transparentCardStyle } from "../styles";
import { DeleteIcon, EditIcon } from "lucide-react";

// --- SUB COMPONENTS ---

const CreateGroupDialog: React.FC<{ open: boolean; onClose: () => void; onSave: (name: string, desc: string) => void }> = ({ open, onClose, onSave }) => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const handleSave = () => { if (!name) return; onSave(name, desc); setName(""); setDesc(""); };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.default, backgroundImage: "none" } }}>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Group Name" fullWidth size="small" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField margin="dense" label="Description" fullWidth size="small" multiline rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

const PermissionSelector: React.FC<{ selected: string[]; onToggle: (key: string) => void }> = ({ selected, onToggle }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {MASTER_PERMISSIONS.map((scope) => {
        const isSelected = selected.includes(scope.key);
        return (
          <Paper key={scope.key} variant="outlined" onClick={() => onToggle(scope.key)} sx={{ p: 1, display: "flex", alignItems: "center", cursor: "pointer", borderColor: isSelected ? theme.palette.success.main : alpha(theme.palette.text.disabled, 0.2), bgcolor: isSelected ? alpha(theme.palette.success.main, 0.08) : "transparent", transition: "all 0.2s", "&:hover": { borderColor: theme.palette.primary.main } }}>
            <Checkbox checked={isSelected} size="small" color="success" sx={{ p: 0.5, mr: 1 }} />
            <Box>
              <Typography variant="body2" fontWeight="bold">{scope.label}</Typography>
              <Typography variant="caption" color="text.secondary">{scope.desc}</Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

const AcceptInviteDialog: React.FC<{ open: boolean; groupName: string; onClose: () => void; onAccept: (perms: string[]) => void }> = ({ open, groupName, onClose, onAccept }) => {
  const [perms, setPerms] = useState<string[]>([]);
  const handleToggle = (key: string) => setPerms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Join Group: {groupName}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>Select data to share. You can update this later.</DialogContentText>
        <PermissionSelector selected={perms} onToggle={handleToggle} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">Decline</Button>
        <Button onClick={() => onAccept(perms)} variant="contained" color="success" startIcon={<CheckCircleOutline />}>Accept & Join</Button>
      </DialogActions>
    </Dialog>
  );
};

const EditPermissionsDialog: React.FC<{ open: boolean; currentPerms: string[]; onClose: () => void; onSave: (perms: string[]) => void }> = ({ open, currentPerms, onClose, onSave }) => {
  const [perms, setPerms] = useState<string[]>(currentPerms);
  const theme = useTheme();
  useEffect(() => setPerms(currentPerms), [currentPerms, open]);
  const handleToggle = (key: string) => setPerms((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}>Edit Shared Data</DialogTitle>
      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}><PermissionSelector selected={perms} onToggle={handleToggle} /></DialogContent>
      <DialogActions sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}><Button onClick={onClose}>Cancel</Button><Button onClick={() => onSave(perms)} variant="contained">Save Changes</Button></DialogActions>
    </Dialog>
  );
};

const GroupDetailDialog: React.FC<{ open: boolean; group: Group | null; currentUserId: string; onClose: () => void; onLeave: () => void; headers: any; showSnackbar: (msg: string, type: any) => void }> = ({ open, group, currentUserId, onClose, onLeave, headers, showSnackbar }) => {
  const theme = useTheme();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteUser, setInviteUser] = useState("");
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editPermsOpen, setEditPermsOpen] = useState(false);
  const [myPerms, setMyPerms] = useState<string[]>([]);

  useEffect(() => {
    if (open && group) {
      fetch(`${API_BASE}/datagroup/${group.id}/members`, { headers }).then((r) => r.json()).then((data) => {
        setMembers(data);
        const me = data.find((m: any) => m.user_id === currentUserId || m.username === currentUserId);
        if (me) setMyPerms(me.granted_permissions || []);
      }).catch(() => showSnackbar("Failed to load members", "error"));
    }
  }, [open, group]);

  useEffect(() => {
    if (!inviteUser || inviteUser.length < 2) { setUserOptions([]); return; }
    const timer = setTimeout(async () => { setSearchLoading(true); try { const res = await fetch(`${API_BASE}/datagroup/users/search?q=${inviteUser}`, { headers }); if (res.ok) setUserOptions(await res.json()); } catch {} finally { setSearchLoading(false); } }, 300);
    return () => clearTimeout(timer);
  }, [inviteUser]);

  const handleInvite = async () => {
    if (!inviteUser || !group) return;
    try {
      const res = await fetch(`${API_BASE}/datagroup/${group.id}/invite`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ username: inviteUser }) });
      if (res.ok) { showSnackbar(`Invited ${inviteUser}`, "success"); setInviteUser(""); setUserOptions([]); } else { const err = await res.json(); showSnackbar(err.detail || "Failed", "error"); }
    } catch { showSnackbar("Failed to invite", "error"); }
  };

  const handleUpdateMyPerms = async (newPerms: string[]) => {
    if (!group) return;
    try {
      const res = await fetch(`${API_BASE}/datagroup/${group.id}/shares`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ granted_permissions: newPerms }) });
      if (res.ok) {
        setMyPerms(newPerms); setEditPermsOpen(false); showSnackbar("Permissions updated", "success");
        const mRes = await fetch(`${API_BASE}/datagroup/${group.id}/members`, { headers }); setMembers(await mRes.json());
      } else showSnackbar("Failed to update permissions", "error");
    } catch { showSnackbar("Update failed", "error"); }
  };

  const toggleReadAccess = async (targetId: string, current: boolean) => { if (!group) return; try { await fetch(`${API_BASE}/datagroup/${group.id}/permissions`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ username: targetId, can_read_data: !current }) }); setMembers((prev) => prev.map((m) => (m.user_id === targetId ? { ...m, can_read_data: !current } : m))); } catch { showSnackbar("Failed to update", "error"); } };
  const handleKickMember = async (targetId: string) => { if (!group || !window.confirm("Remove this user?")) return; try { const res = await fetch(`${API_BASE}/datagroup/${group.id}/members/${targetId}`, { method: "DELETE", headers }); if (res.ok) { setMembers((prev) => prev.filter((m) => m.user_id !== targetId)); showSnackbar("User removed", "info"); } } catch { showSnackbar("Error removing user", "error"); } };
  const handleLeaveGroup = async () => { if (!group || !window.confirm("Leave this group?")) return; try { const res = await fetch(`${API_BASE}/datagroup/${group.id}/leave`, { method: "DELETE", headers }); if (res.ok) { showSnackbar("Left group", "info"); onLeave(); } } catch { showSnackbar("Error leaving group", "error"); } };
  const handleDeleteGroup = async () => { if (!group || !window.confirm("Delete group?")) return; try { const res = await fetch(`${API_BASE}/datagroup/${group.id}`, { method: "DELETE", headers }); if (res.ok) { showSnackbar("Group deleted", "info"); onLeave(); } } catch { showSnackbar("Error deleting group", "error"); } };

  const renderPermTooltip = (perms: string[]) => (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" fontWeight="bold" sx={{ mb: 1, display: "block", color: "common.white", borderBottom: "1px solid rgba(255,255,255,0.2)", pb: 0.5 }}>Sharing Data:</Typography>
      {!perms || perms.length === 0 ? <Typography variant="caption" color="grey.400" sx={{ fontStyle: "italic" }}>No data shared</Typography> : MASTER_PERMISSIONS.map((scope) => { if (!perms.includes(scope.key)) return null; return (<Box key={scope.key} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleOutline sx={{ fontSize: 12, color: "success.light" }} /><Typography variant="caption" sx={{ color: "common.white" }}>{scope.label}</Typography></Box>); })}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: alpha(theme.palette.background.default, 1) }}>
        <Box><Typography variant="h6">{group?.name}</Typography><Typography variant="caption" color="text.secondary">{group?.description || "Manage your group settings"}</Typography></Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {!group?.is_owner && <Button size="small" color="error" startIcon={<LeaveIcon />} onClick={handleLeaveGroup}>Leave</Button>}
          {group?.is_owner && <Button size="small" color="error" startIcon={<DeleteForever />} onClick={handleDeleteGroup}>Delete</Button>}
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 1) }}>
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}><VpnKey fontSize="small" /> Your Group API Key</Typography>
          <Paper variant="outlined" sx={{ p: "2px 4px", display: "flex", alignItems: "center", bgcolor: theme.palette.background.default, borderColor: alpha(theme.palette.success.main, 0.3) }}>
            <InputAdornment position="start" sx={{ pl: 1 }}><Key fontSize="small" color="action" /></InputAdornment>
            <TextField variant="standard" fullWidth value={group?.my_full_token || "Loading..."} InputProps={{ disableUnderline: true, readOnly: true, sx: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
            <Tooltip title="Copy Key"><IconButton onClick={() => { navigator.clipboard.writeText(group?.my_full_token || ""); showSnackbar("Copied", "success"); }} color="primary"><ContentCopy fontSize="small" /></IconButton></Tooltip>
          </Paper>
        </Box>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">Members ({members.length})</Typography>
            <Button size="small" startIcon={<EditIcon />} onClick={() => setEditPermsOpen(true)}>Edit My Shared Data</Button>
          </Box>
          {group?.is_owner && (
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              <Autocomplete freeSolo fullWidth size="small" options={userOptions} loading={searchLoading} inputValue={inviteUser} onInputChange={(e, val) => setInviteUser(val)} slotProps={{ paper: { sx: { bgcolor: "background.default" } } }} renderInput={(params) => (<TextField {...params} placeholder="Search user to invite..." InputProps={{ ...params.InputProps, startAdornment: (<PersonAdd sx={{ color: "action.active", mr: 1 }} />), endAdornment: (<React.Fragment>{searchLoading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</React.Fragment>) }} />)} renderOption={(props, option) => (<Box component="li" {...props} sx={{ bgcolor: "background.default" }}>{option.label || option}</Box>)} />
              <Button variant="contained" onClick={handleInvite} sx={{ px: 3 }}>Invite</Button>
            </Box>
          )}
          <List dense disablePadding sx={{ maxHeight: 300, overflow: "auto" }}>
            {members.map((m) => {
              const isMe = m.user_id === currentUserId;
              return (
                <ListItem key={m.user_id} divider>
                  <ListItemText primary={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography variant="body2" fontWeight="bold">{m.username}</Typography>{isMe && <Chip label="YOU" size="small" color="info" sx={{ height: 18, fontSize: "0.6rem" }} />}{m.user_id === group?.owner_id && <Chip label="OWNER" size="small" color="warning" sx={{ height: 18, fontSize: "0.6rem" }} />}</Box>} secondary={<Stack direction="row" spacing={1} mt={0.5} alignItems="center">{m.status === "INVITED" ? <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ height: 20 }} /> : <Chip label="Active" size="small" color="success" variant="outlined" sx={{ height: 20 }} />}<Tooltip title={renderPermTooltip(m.granted_permissions)} arrow placement="top" componentsProps={{ tooltip: { sx: { bgcolor: "rgba(0,0,0,0.9)", border: "1px solid #333" } } }}><Typography variant="caption" color="text.secondary" sx={{ cursor: "help", borderBottom: "1px dotted grey", "&:hover": { color: theme.palette.primary.main } }}>Sharing {m.granted_permissions?.length || 0} scopes</Typography></Tooltip></Stack>} />
                  <ListItemSecondaryAction><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{group?.is_owner && !isMe ? <><Tooltip title="Allow read access"><Switch size="small" checked={m.can_read_data} onChange={() => toggleReadAccess(m.user_id, m.can_read_data)} /></Tooltip><IconButton size="small" color="error" onClick={() => handleKickMember(m.user_id)}><DeleteIcon fontSize="small" /></IconButton></> : m.can_read_data && <Chip label="Reader" size="small" color="success" variant="outlined" sx={{ height: 20 }} />}</Box></ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </DialogContent>
      <EditPermissionsDialog open={editPermsOpen} currentPerms={myPerms} onClose={() => setEditPermsOpen(false)} onSave={handleUpdateMyPerms} />
    </Dialog>
  );
};

// --- MAIN GROUPS SECTION ---
const GroupsSection: React.FC<{ userId: string; headers: any; showSnackbar: (msg: string, type: any) => void; wsTrigger: number; }> = ({ userId, headers, showSnackbar, wsTrigger }) => {
  const theme = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<Group[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [acceptInviteData, setAcceptInviteData] = useState<{ open: boolean; group: Group | null; }>({ open: false, group: null });

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/datagroup/`, { headers });
      const data: Group[] = await res.json();
      setGroups(data.filter((g) => g.my_status === "ACCEPTED"));
      setInvites(data.filter((g) => g.my_status === "INVITED"));
    } catch {}
  };

  useEffect(() => { fetchGroups(); }, [wsTrigger]);

  const handleCreate = async (name: string, desc: string) => {
    try {
      const res = await fetch(`${API_BASE}/datagroup/`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc }) });
      if (res.ok) { showSnackbar("Group Created!", "success"); setCreateOpen(false); fetchGroups(); }
    } catch { showSnackbar("Error", "error"); }
  };

  const handleAcceptInvite = async (perms: string[]) => {
    const group = acceptInviteData.group; if (!group) return;
    try {
      const res = await fetch(`${API_BASE}/datagroup/${group.id}/accept`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ granted_permissions: perms }) });
      const data = await res.json();
      if (res.ok) { setAcceptInviteData({ open: false, group: null }); showSnackbar("Joined Group", "success"); fetchGroups(); alert(`You joined ${group.name}.\n\nYour SECRET SUFFIX is: ${data.personal_suffix}`); }
    } catch { showSnackbar("Error accepting", "error"); }
  };

  return (
    <Paper sx={transparentCardStyle(theme)}>
      <SectionHeader icon={<GroupsIcon />} title="Data Groups" color={theme.palette.secondary.main} badge={invites.length} guideSteps={dataGroupsGuideSteps}/>
      {invites.length > 0 && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2, bgcolor: alpha(theme.palette.background.default, 0.1) }}>
          <Typography variant="caption" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}><NotificationsActive fontSize="inherit" /> Pending Invites</Typography>
          <Stack spacing={1} mt={1}>{invites.map((inv) => (<Box key={inv.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, border: `1px solid ${theme.palette.info.main}`, borderRadius: 1 }}><Typography variant="body2" fontWeight="bold">{inv.name}</Typography><Button size="small" variant="contained" color="success" onClick={() => setAcceptInviteData({ open: true, group: inv })} sx={{ height: 24, fontSize: "0.7rem" }}>Review & Join</Button></Box>))}</Stack>
        </Alert>
      )}
      <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 1, maxHeight: 200, pr: 0.5 }}>
        <List dense disablePadding>
          {groups.map((g) => (
            <ListItem key={g.id} button onClick={() => setSelectedGroup(g)} secondaryAction={g.is_owner ? <Chip label="Owner" size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} /> : null} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.3)}`, borderRadius: 1, mb: 1, transition: "all 0.2s", "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: theme.palette.primary.main } }}>
              <ListItemText primary={<Typography variant="body2" fontWeight="medium">{g.name}</Typography>} secondary={<Typography variant="caption" color="text.secondary">{g.members_count || 1} members</Typography>} />
            </ListItem>
          ))}
        </List>
        {groups.length === 0 && invites.length === 0 && (<Box sx={{ py: 3, textAlign: "center", opacity: 0.6 }}><Typography variant="caption">No groups yet.</Typography></Box>)}
      </Box>
      <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: "auto" }}>Create Group</Button>
      <CreateGroupDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      {acceptInviteData.group && <AcceptInviteDialog open={acceptInviteData.open} groupName={acceptInviteData.group.name} onClose={() => setAcceptInviteData({ open: false, group: null })} onAccept={handleAcceptInvite} />}
      <GroupDetailDialog open={!!selectedGroup} group={selectedGroup} currentUserId={userId} onClose={() => setSelectedGroup(null)} onLeave={() => { setSelectedGroup(null); fetchGroups(); }} headers={headers} showSnackbar={showSnackbar} />
    </Paper>
  );
};

export default GroupsSection;