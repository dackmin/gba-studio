import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  Inset,
  ScrollArea,
  Spinner,
  Text,
  TextField,
} from '@radix-ui/themes';
import { classNames } from '@junipero/react';

import { AVAILABLE_EVENTS } from '../../services/events';
import { useDelayedValue } from '../../services/hooks';

export interface CatalogueProps {
  onSelect?: (eventType: string) => void;
}

const Catalogue = ({
  onSelect,
}: CatalogueProps) => {
  const [rawSearch, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const search = useDelayedValue(rawSearch, { delay: 200 });

  useEffect(() => {
    setLoading(true);
  }, [rawSearch]);

  useEffect(() => {
    setLoading(false);
  }, [search]);

  const events = useMemo(() => (
    AVAILABLE_EVENTS.map(c => ({
      ...c,
      items: c.items.filter(i => (
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.value.toLowerCase().includes(search.toLowerCase()) ||
        i.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
      )),
    }))
  ), [search]);

  const eventsCount = useMemo(() => (
    events.flatMap(c => c.items).length
  ), [events]);

  const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
  };

  return (
    <div className="flex flex-col gap-8">
      <TextField.Root
        placeholder="Search events..."
        size="3"
        value={rawSearch}
        onChange={onSearchChange}
      >
        { loading && (
          <TextField.Slot side="right">
            <Spinner />
          </TextField.Slot>
        ) }
      </TextField.Root>

      <Inset className="!rounded-none !overflow-visible">
        <ScrollArea className="!h-[300px]">
          <div className="p-6 flex flex-col gap-4">
            { eventsCount === 0 ? (
              <div className="p-3 text-gray-500 text-center">
                No events found
              </div>
            ) : events.map(category => category.items.length > 0 && (
              <div key={category.name}>
                <Text className="block text-slate mb-2">{ category.name }</Text>
                { category.items.map(item => (
                  <Dialog.Close key={item.value}>
                    <div
                      className={classNames(
                        'rounded-xl -mx-3 px-3 py-1 hover:bg-(--gray-3)',
                        'flex items-center gap-2 cursor-pointer',
                      )}
                      onClick={onSelect?.bind(null, item.value)}
                    >
                      { item.icon && (
                        <item.icon className="[&_path]:fill-(--accent-9)" />
                      ) }
                      <Text>{ item.name }</Text>
                    </div>
                  </Dialog.Close>
                )) }
              </div>
            )) }
          </div>
        </ScrollArea>
      </Inset>
    </div>
  );
};

export default Catalogue;
