export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p className="font-body">&copy; {new Date().getFullYear()} Mr James Luxury Transport. All rights reserved.</p>
        <p className="text-sm font-body mt-1">Experience luxury in motion.</p>
      </div>
    </footer>
  );
}
