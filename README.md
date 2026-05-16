# 19 — Angular UI

**Difficulty:** Intermediate (7/10) · **Angular 17** · **NgRx** · **RxJS**

Angular 17 Standalone Components, Signals, NgRx State Management ve RxJS reactive patterns.

---

## Angular 17 Yenilikleri

### Standalone Components (no NgModule)
```typescript
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [AsyncPipe, NgFor, RouterLink],  // import direkt component'a
  template: `...`,
})
export class ProductListComponent { }

// Bootstrap (main.ts)
bootstrapApplication(AppComponent, appConfig);
```

### inject() — Constructor DI yerine
```typescript
// Eski (constructor)
constructor(private store: Store, private route: ActivatedRoute) {}

// Yeni (Angular 14+)
private store = inject(Store);
private route = inject(ActivatedRoute);
```

### Signals — Reactive Primitive
```typescript
// Signal: değer tutan reaktif konteyner
count = signal(0);

// Güncelleme
count.set(5);
count.update(v => v + 1);

// Computed — türetilmiş signal (memoized)
doubled = computed(() => this.count() * 2);

// Effect — side effect
effect(() => console.log('count changed:', this.count()));
```

### New Control Flow (@for, @if, @switch)
```html
<!-- Eski *ngFor -->
<div *ngFor="let p of products; trackBy: trackById">

<!-- Yeni @for (Angular 17) -->
@for (product of products; track product.id) {
  <div>{{ product.name }}</div>
} @empty {
  <p>Ürün bulunamadı.</p>
}

@if (loading) {
  <spinner />
} @else if (error) {
  <error-banner />
} @else {
  <content />
}
```

---

## NgRx State Management

### Store Yapısı
```
Action → Reducer → Store → Selector → Component
  ↑                              |
  └──── Effect (HTTP) ───────────┘
```

### Action
```typescript
export const loadProducts = createAction(
  '[Product List] Load Products',
  props<{ params: Partial<SearchParams> }>()
);
```

### Reducer (pure function)
```typescript
export const productReducer = createReducer(
  initialState,
  on(loadProducts, state => ({ ...state, loading: true })),
  on(loadProductsSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    products: response.content,
  }))
);
```

### Selector (memoized)
```typescript
export const selectCartTotal = createSelector(
  selectCart,
  cart => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
);

// Component'ta kullanım
cartTotal$ = this.store.select(selectCartTotal);
// Template: {{ cartTotal$ | async | currency }}
```

### Effect (HTTP side effects)
```typescript
loadProducts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadProducts),
    switchMap(({ params }) =>
      this.productService.getAll(params).pipe(
        map(response => loadProductsSuccess({ response })),
        catchError(error => of(loadProductsFailure({ error: error.message })))
      )
    )
  )
);
```

---

## RxJS Operators

### switchMap vs concatMap vs mergeMap vs exhaustMap
```
switchMap  → yeni değer gelince öncekini iptal (search, navigation)
concatMap  → sıralı, kayıpsız (form submit, sıralı upload)
mergeMap   → paralel (bağımsız işlemler)
exhaustMap → işlem bitene kadar yeni değerleri yoksay (tek submit)
```

### Search-as-you-type
```typescript
searchControl.valueChanges.pipe(
  debounceTime(300),          // 300ms bekle
  distinctUntilChanged(),     // aynı değer tekrar tetikleme
  switchMap(query =>          // önceki istek iptal
    this.service.search(query)
  )
).subscribe(results => ...);
```

### shareReplay — HTTP Cache
```typescript
products$ = this.http.get<Product[]>('/api/products').pipe(
  shareReplay(1)  // son değeri cache'le, yeni subscriber tekrar HTTP yapmaz
);
```

---

## Routing

### Lazy Loading
```typescript
{
  path: 'products',
  loadComponent: () => import('./product-list.component')
    .then(m => m.ProductListComponent)
}
```

### Functional Guards
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access_token');
  return token ? true : inject(Router).createUrlTree(['/login']);
};

// Route'da kullan
{ path: 'cart', canActivate: [authGuard], ... }
```

### Route Inputs (Angular 16+)
```typescript
// withComponentInputBinding() ile route params → @Input()
@Component(...)
export class ProductDetailComponent {
  @Input() id!: string;  // /products/:id → otomatik bind
}
```

---

## HTTP Interceptors (Functional)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401) inject(Router).navigate(['/login']);
      return throwError(() => error);
    })
  );
};

// app.config.ts'te kayıt
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## Mülakat Soruları

**Q: Signal vs Observable farkı?**
A: Signal senkron, reactive primitive — anlık değer okunabilir, `()` ile. Observable asenkron, lazy, stream. Signal daha basit, Observable daha güçlü (operator pipeline).

**Q: `switchMap` ne zaman kullanılır?**
A: Yeni değer gelince önceki işlemi iptal etmek istediğinde — search, route değişimi. Form submit için `exhaustMap` (bir bitene kadar yeni tıklamayı ignore).

**Q: NgRx neden kullanılır?**
A: Büyük uygulamalarda component'lar arası state yönetimi için. Single source of truth, zaman yolculuğu debugging, effect ile side effect izolasyonu.

**Q: `createSelector` neden memoized?**
A: Girdi selector'lar değişmezse sonucu hesaplamaz — tekrar kullanır. Büyük state'lerde performans kritik.

**Q: Standalone component ile NgModule farkı?**
A: Standalone: modülsüz, `imports` direkt componenta. NgModule: merkezi bildirim, lazy loaded feature modules. Angular 17'de standalone default.

**Q: Lazy loading nasıl çalışır?**
A: Route'a gidilene kadar component bundle'ı indirilmez. `loadComponent()` ile chunk ayrılır — ilk yükleme daha hızlı.

---

## Çalıştırma

```bash
# Bağımlılıkları kur
npm install

# Geliştirme sunucusu
ng serve  → http://localhost:4200

# Prod build
ng build --configuration production

# Test
ng test --no-watch --browsers=ChromeHeadless
```
