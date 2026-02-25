import { Button, Drawer } from "@medusajs/ui";

type DrawerComponentProps = {
  title: string;
  content: any;
  triggerText?: string;
};

export default function DrawerComponent({
  title,
  content,
  triggerText,
}: DrawerComponentProps) {
  return (
    <Drawer>
      <Drawer.Trigger asChild>
        <Button className={triggerText ? "" : "w-[280px]"}>{triggerText || title}</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4 overflow-y-auto">{content}</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
