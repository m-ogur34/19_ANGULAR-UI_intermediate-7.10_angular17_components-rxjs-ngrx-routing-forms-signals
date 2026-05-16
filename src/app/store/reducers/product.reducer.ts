import { createReducer, on } from '@ngrx/store';
import { CartItem, PaginatedResponse, Product } from '../../models/product.model';
import * as ProductActions from '../actions/product.actions';

export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  searchResults: Product[];
  pagination: Omit<PaginatedResponse<Product>, 'content'> | null;
  cart: CartItem[];
  loading: boolean;
  error: string | null;
}

export const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  searchResults: [],
  pagination: null,
  cart: [],
  loading: false,
  error: null,
};

export const productReducer = createReducer(
  initialState,

  // Load products
  on(ProductActions.loadProducts, state => ({ ...state, loading: true, error: null })),
  on(ProductActions.loadProductsSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    products: response.content,
    pagination: {
      totalElements: response.totalElements,
      totalPages: response.totalPages,
      size: response.size,
      number: response.number,
    },
  })),
  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Load single
  on(ProductActions.loadProduct, state => ({ ...state, loading: true })),
  on(ProductActions.loadProductSuccess, (state, { product }) => ({
    ...state, loading: false, selectedProduct: product,
  })),
  on(ProductActions.loadProductFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Search
  on(ProductActions.searchProducts, state => ({ ...state, loading: true })),
  on(ProductActions.searchProductsSuccess, (state, { products }) => ({
    ...state, loading: false, searchResults: products,
  })),
  on(ProductActions.searchProductsFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // Cart
  on(ProductActions.addToCart, (state, { product, quantity }) => {
    const existing = state.cart.find(i => i.product.id === product.id);
    const cart = existing
      ? state.cart.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      : [...state.cart, { product, quantity }];
    return { ...state, cart };
  }),

  on(ProductActions.removeFromCart, (state, { productId }) => ({
    ...state,
    cart: state.cart.filter(i => i.product.id !== productId),
  })),

  on(ProductActions.updateQuantity, (state, { productId, quantity }) => ({
    ...state,
    cart: state.cart.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ),
  })),

  on(ProductActions.clearCart, state => ({ ...state, cart: [] }))
);
