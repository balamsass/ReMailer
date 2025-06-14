import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Download
} from "lucide-react";
import type { Contact } from "@shared/schema";

interface EnhancedContactsTableProps {
  contacts: Contact[];
  total: number;
  active: number;
  isLoading: boolean;
  onSearch: (search: string) => void;
  onFilter: (filters: { status?: string; tags?: string }) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onBulkAction: (action: 'delete' | 'activate' | 'deactivate' | 'bounced' | 'unsubscribed', contactIds: number[]) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: number) => void;
  onChangeStatus: (contactId: number, status: string) => void;
}

export default function EnhancedContactsTable({
  contacts,
  total,
  active,
  isLoading,
  onSearch,
  onFilter,
  onSort,
  onBulkAction,
  onEditContact,
  onDeleteContact,
  onChangeStatus
}: EnhancedContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    onFilter({ status: value === "all" ? undefined : value });
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    onSort(column, newOrder);
  };

  const handleBulkAction = (action: string) => {
    if (selectedContacts.length === 0) return;
    
    onBulkAction(action as any, selectedContacts);
    setSelectedContacts([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'bounced':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Bounced</Badge>;
      case 'unsubscribed':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="w-3 h-3 mr-1" />Unsubscribed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Total: {total}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Active: {active}</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <span className="text-sm font-medium">
            {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('activate')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('deactivate')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('delete')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('email')}
                  className="h-auto p-0 font-semibold"
                >
                  Email {getSortIcon('email')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold"
                >
                  Name {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('company')}
                  className="h-auto p-0 font-semibold"
                >
                  Company {getSortIcon('company')}
                </Button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-semibold"
                >
                  Status {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('createdAt')}
                  className="h-auto p-0 font-semibold"
                >
                  Created {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading contacts...
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contact.email}</TableCell>
                  <TableCell>{contact.name || '-'}</TableCell>
                  <TableCell>{contact.company || '-'}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditContact(contact)}>
                          Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus(contact.id, contact.status === 'active' ? 'inactive' : 'active')}>
                          {contact.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteContact(contact.id)}
                          className="text-red-600"
                        >
                          Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}