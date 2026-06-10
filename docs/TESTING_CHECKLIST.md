# Testing Checklist - DR.IT E-Commerce

## Store Frontend

### Homepage
- [ ] Homepage loads correctly
- [ ] Hero section displays
- [ ] Latest 20 products grid renders
- [ ] Category sidebar links work
- [ ] Product cards link to detail pages

### Product Pages
- [ ] Product detail page loads with correct data
- [ ] Image gallery / thumbnail selection works
- [ ] Quantity selector (+/-) works
- [ ] Add to cart button works
- [ ] Cart drawer opens on add
- [ ] Toast notification appears
- [ ] Cart count in header updates
- [ ] Out of stock products show "غير متوفر حالياً" and disabled button
- [ ] Low stock (≤5) shows warning
- [ ] Share button works
- [ ] Related products section displays
- [ ] Breadcrumbs display correctly

### Categories & Brands
- [ ] Categories page lists all categories
- [ ] Category detail page shows filtered products
- [ ] Brands page lists all brands
- [ ] Brand detail page shows filtered products
- [ ] Pagination works on category/brand pages
- [ ] Sort and filter options work

### Search
- [ ] Search returns results
- [ ] Empty search shows message
- [ ] Search works with SKU, name, brand

### Cart
- [ ] Add to cart from product card works
- [ ] Add to cart from product detail works
- [ ] Cart drawer shows items
- [ ] Cart page shows items
- [ ] Update quantity works
- [ ] Remove item works
- [ ] Clear cart with confirmation works
- [ ] Tax calculation is correct

### Checkout
- [ ] Checkout form pre-fills for logged-in users
- [ ] Checkout form validates
- [ ] Order creates successfully
- [ ] Stock decreases after order
- [ ] Order confirmation page shows order details
- [ ] Guest checkout works without login

### Authentication
- [ ] Register creates account
- [ ] Register redirects to /account
- [ ] Login works with correct credentials
- [ ] Login redirects to /account
- [ ] Logout works
- [ ] Error messages display for wrong credentials
- [ ] Rate limiting works after 8 failed attempts
- [ ] isActive=false users cannot login

### Account
- [ ] /account shows user info
- [ ] /account redirects to /login if not logged in
- [ ] /account/orders shows order history
- [ ] Order history links to confirmation page

### SEO
- [ ] Each page has correct title tag
- [ ] OpenGraph meta tags present
- [ ] robots.txt blocks /admin, /api, /account
- [ ] sitemap.xml includes products, categories, brands
- [ ] Product pages have JSON-LD structured data

## Admin Panel

### Auth
- [ ] /admin redirects to /admin/login for guests
- [ ] /admin redirects to / for customers
- [ ] Admin login works
- [ ] Admin session persists across pages

### Dashboard
- [ ] Stats display correctly
- [ ] Recent orders show

### Products
- [ ] Product list displays
- [ ] Search/filter works
- [ ] Add product works
- [ ] Edit product works
- [ ] Toggle active/inactive works
- [ ] Upload image works

### Categories
- [ ] Category list displays
- [ ] Add category works
- [ ] Edit category works

### Brands
- [ ] Brand list displays
- [ ] Add brand works
- [ ] Edit brand works

### Orders
- [ ] Order list displays
- [ ] Search orders works
- [ ] Change order status works

### Customers
- [ ] Customer list displays

### Settings
- [ ] Settings form loads current values
- [ ] Save settings works

### Sync
- [ ] Sync page shows previous runs
- [ ] Run sync button triggers import

## Performance & Build

- [ ] `npx prisma validate` passes
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] All routes compile without errors