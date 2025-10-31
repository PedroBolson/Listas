import { useAuth } from "../../auth/useAuth";
import { useListItemsCount } from "../../../hooks/useLists";
import { ListCard } from "./ListCard";
import type { ListRecord } from "../../../domain/models";

interface ListCardWithDataProps {
    list: ListRecord;
}

export function ListCardWithData({ list }: ListCardWithDataProps) {
    const { domainUser } = useAuth();
    const primaryFamilyId = domainUser?.props.primaryFamilyId ?? null;

    const { itemsCount, completedCount } = useListItemsCount(primaryFamilyId, list.id);

    return <ListCard list={list} itemsCount={itemsCount} completedCount={completedCount} />;
}
