import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`)

      if (response.data.amount < 2) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        let productExist = cart.find(product => product.id === productId);
        let newCart;

        if (!productExist) {
          const responseProduct = await api.get<Product>(`/products/${productId}`)

          productExist = {
            ...responseProduct.data,
            amount: 1
          }

          newCart = [...cart, productExist];
          setCart(newCart)
        } else {
          newCart = cart.map(product => product.id !== productId ? product : {
            ...product,
            amount: product.amount + 1
          })

          setCart(newCart)
        }

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId);

      if (productExist) {
        const newCart = cart.filter(product => product.id !== productId);

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw new Error('Quantidade inválida')
      }

      const { data: productStock } = await api.get<Stock>(`/stock/${productId}`)

      if (productStock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCart = cart.map(product => product.id !== productId ? product : {
        ...product,
        amount,
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      setCart(newCart)
      // if (amount > 0) {
      //   const productExist = cart.find(product => product.id === productId);

      //   if (productExist) {
      //     const response = await api.get<Stock>(`stock/${productId}`);
      //     const productStock = response.data;

      //     if (productStock.amount < amount) {
      //       toast.error('Erro na alteração de quantidade do produto');
      //     } else {
      //       const newCart = cart.map(product => {
      //         if (product.id === productId) {
      //           return { ...product, amount };
      //         }

      //         return product;
      //       });
      //       setCart(newCart);

      //       localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      //     }
      //   } else {
      //     toast.error('Erro na alteração de quantidade do produto');
      //   }
      // } else {
      //   toast.error('Erro na alteração de quantidade do produto');
      // }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
