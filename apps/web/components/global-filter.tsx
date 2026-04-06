import React, { useState } from "react";
import {
  CalendarIcon,
  Search,
  ChevronDown,
  Save,
  Store,
  Filter,
  X,
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { formatDate } from "@/lib/format-date";
import { format } from "date-fns";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface GlobalFilterProps {
  onFilterChange?: (filters: any) => void;
  className?: string;
}

export function GlobalFilter({ className }: GlobalFilterProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Lojas disponíveis (simulação)
  const availableStores = [
    { id: "amazon", name: "Amazon" },
    { id: "mercadolivre", name: "Mercado Livre" },
    { id: "shopee", name: "Shopee" },
  ];

  const datePresets = [
    { label: "Últimos 7 dias", days: 7 },
    { label: "Últimos 30 dias", days: 30 },
    { label: "Últimos 90 dias", days: 90 },
    { label: "Personalizado", days: 0 },
  ];

  const applyDatePreset = (days: number) => {
    if (days === 0) return; // Personalizado - não fazer nada

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    setDateRange({ from, to });
  };

  const handleStoreToggle = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const clearFilters = () => {
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    });
    setSelectedStores([]);
    setSearchValue("");
  };

  const saveView = () => {
    // Aqui seria implementada a lógica para salvar a visualização
    console.log("Filtros salvos:", { dateRange, selectedStores, searchValue });
  };

  // Formatação do intervalo de datas
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      if (formatDate(dateRange.from) === formatDate(dateRange.to)) {
        return `${format(dateRange.from, "dd", { locale: ptBR })} - ${format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}`;
      }
      return `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}`;
    }
    return "Selecione um período";
  };

  return (
    <div
      className={cn(
        " p-4 rounded-lg border shadow-sm sticky top-0 z-30 bg-sidebar",
        className
      )}
    >
      <div className="flex flex-col md:flex-row gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-40 md:flex-grow-0"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{formatDateRange()}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="border-b p-3 flex flex-wrap gap-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyDatePreset(preset.days)}
                  className={cn(
                    "text-xs",
                    preset.days === 30 &&
                      dateRange.from &&
                      dateRange.to &&
                      Math.round(
                        (dateRange.to.getTime() - dateRange.from.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) === 30
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              // onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Store Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between min-w-40">
              <Store className="mr-2 h-4 w-4" />
              <span className="truncate">
                {selectedStores.length
                  ? `${selectedStores.length} ${selectedStores.length === 1 ? "loja" : "lojas"}`
                  : "Todas as lojas"}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="start">
            <div className="space-y-2">
              <div className="font-medium text-sm mb-3">Selecionar Lojas</div>
              {availableStores.map((store) => (
                <div
                  key={store.id}
                  className={cn(
                    "flex items-center p-2 rounded-md cursor-pointer",
                    selectedStores.includes(store.id)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary"
                  )}
                  onClick={() => handleStoreToggle(store.id)}
                >
                  <div className="flex-1 font-inter text-sm">{store.name}</div>
                  {selectedStores.includes(store.id) && (
                    <Badge className="bg-primary">Selecionada</Badge>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por SKU ou ASIN..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchValue && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchValue("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="md:flex-shrink-0"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avançados
        </Button>

        {/* Save View Button */}
        <Button
          variant="outline"
          onClick={saveView}
          className="md:flex-shrink-0"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Visualização
        </Button>
      </div>

      {/* Advanced Filters Panel - expandido */}
      {isAdvancedOpen && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Eletrônicos</SelectItem>
                <SelectItem value="fashion">Moda</SelectItem>
                <SelectItem value="home">Casa e Decoração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status de Estoque
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Estoque Baixo</SelectItem>
                <SelectItem value="out">Esgotado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Margem</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todas as margens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta (&gt;30%)</SelectItem>
                <SelectItem value="medium">Média (15-30%)</SelectItem>
                <SelectItem value="low">Baixa (&lt;15%)</SelectItem>
                <SelectItem value="negative">Negativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-3 flex justify-end">
            <Button variant="ghost" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
