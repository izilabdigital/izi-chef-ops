import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categories = [
  { value: null, label: 'Todos' },
  { value: 'classica', label: 'Clássicas' },
  { value: 'especial', label: 'Especiais' },
  { value: 'doce', label: 'Doces' },
  { value: 'meio-a-meio', label: 'Meio a Meio' },
];

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.value || 'all'}
          variant={selectedCategory === category.value ? 'default' : 'outline'}
          onClick={() => onCategoryChange(category.value)}
          className={cn(
            "transition-all",
            selectedCategory === category.value && "bg-primary text-primary-foreground"
          )}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;