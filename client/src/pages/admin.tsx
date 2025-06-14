import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Clock, Users, Activity, Shield, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("users");
  const [userFilters, setUserFilters] = useState({ search: "", role: "all" });
  const [auditFilters, setAuditFilters] = useState({ 
    userId: "", 
    action: "", 
    startDate: "", 
    endDate: "" 
  });
  
  // Create user dialog state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  // Users data
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users", userFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userFilters.search) params.append("search", userFilters.search);
      if (userFilters.role && userFilters.role !== "all") params.append("role", userFilters.role);
      return fetch(`/api/admin/users?${params}`).then(res => res.json());
    },
  });

  // Audit logs data
  const { data: auditLogs } = useQuery({
    queryKey: ["/api/admin/audit-logs", auditFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(auditFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/admin/audit-logs?${params}`).then(res => res.json());
    },
  });

  // Service health data
  const { data: serviceHealth = [] } = useQuery({
    queryKey: ["/api/admin/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // API usage data
  const { data: apiUsage = { totalRequests: 0, avgResponseTime: 0, errorRate: 0, topEndpoints: [] } } = useQuery({
    queryKey: ["/api/admin/api-usage"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: string }) => {
      return await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
      
      toast({
        title: "User role updated",
        description: `User role has been updated to ${role}`,
      });
      
      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
      });
      
      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, monitor system health, and review audit logs
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="w-4 h-4 mr-2" />
            Service Health
          </TabsTrigger>
          <TabsTrigger value="api">
            <CheckCircle className="w-4 h-4 mr-2" />
            API Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateUserOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Input
                  placeholder="Search users..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="max-w-sm"
                />
                <Select
                  value={userFilters.role}
                  onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(role) => updateUserRole(user.id, role)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {usersData?.total && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {usersData.users?.length || 0} of {usersData.total} users
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Track system activities and user actions
              </CardDescription>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <Input
                  placeholder="User ID"
                  value={auditFilters.userId}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, userId: e.target.value }))}
                />
                <Input
                  placeholder="Action"
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={auditFilters.startDate}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={auditFilters.endDate}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.logs?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.user ? `${log.user.name} (${log.user.email})` : "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Health Monitor</CardTitle>
              <CardDescription>
                Monitor the health status of all system services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {(serviceHealth as any[])?.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{service.serviceName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last checked: {new Date(service.lastCheck).toLocaleString()}
                      </p>
                      {service.responseTime && (
                        <p className="text-sm text-muted-foreground">
                          Response time: {service.responseTime}ms
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(service.status)}
                      {service.uptime && (
                        <Badge variant="outline">{service.uptime}% uptime</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(apiUsage as any)?.totalRequests || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(apiUsage as any)?.avgResponseTime || 0}ms</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((apiUsage as any)?.errorRate || 0).toFixed(2)}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((apiUsage as any)?.topEndpoints || []).length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top API Endpoints</CardTitle>
              <CardDescription>
                Most frequently used API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Avg Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((apiUsage as any)?.topEndpoints || []).map((endpoint: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>{endpoint.requests}</TableCell>
                      <TableCell>{endpoint.avgResponseTime?.toFixed(2) || 0}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
                placeholder="john@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="col-span-3"
                placeholder="Enter password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}