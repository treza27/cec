/*
  # Create FAQ items table

  1. New Tables
    - `faq_items`
      - `id` (bigint, primary key, auto-increment)
      - `category` (text) - Category for grouping questions
      - `question_fr` (text) - Question in French
      - `answer_fr` (text) - Answer in French
      - `question_en` (text) - Question in English
      - `answer_en` (text) - Answer in English
      - `order` (integer) - Custom display order
      - `is_active` (boolean) - Whether the FAQ item is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `faq_items` table
    - Add policy for anonymous users to read active FAQ items
    - Add policy for authenticated users to manage FAQ items

  3. Functions
    - Create trigger function to update `updated_at` column
    - Create trigger to automatically update `updated_at` on row updates

  4. Sample Data
    - Insert some sample FAQ items in French and English
*/

-- Create the faq_items table
CREATE TABLE IF NOT EXISTS faq_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  category text NOT NULL DEFAULT 'general',
  question_fr text NOT NULL,
  answer_fr text NOT NULL,
  question_en text NOT NULL,
  answer_en text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous users to read active FAQ items"
  ON faq_items
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to read all FAQ items"
  ON faq_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage FAQ items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_items_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_items_order ON faq_items(order_index);
CREATE INDEX IF NOT EXISTS idx_faq_items_active ON faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_items_created_at ON faq_items(created_at);

-- Insert sample FAQ data
INSERT INTO faq_items (category, question_fr, answer_fr, question_en, answer_en, order_index) VALUES
('general', 
 'Qu''est-ce que Continental Express Cargo ?', 
 'Continental Express Cargo est une entreprise spécialisée dans le transport maritime entre la Chine et Madagascar. Nous offrons des services de groupage, de suivi en temps réel et de livraison sécurisée pour particuliers et professionnels.',
 'What is Continental Express Cargo?',
 'Continental Express Cargo is a company specialized in maritime transport between China and Madagascar. We offer groupage services, real-time tracking and secure delivery for individuals and professionals.',
 1),

('general',
 'Dans quelles villes en Chine avez-vous des entrepôts ?',
 'Nous avons des entrepôts dans deux villes principales en Chine : Guangzhou et Yiwu. Ces emplacements stratégiques nous permettent de couvrir la plupart des besoins d''expédition depuis la Chine.',
 'In which cities in China do you have warehouses?',
 'We have warehouses in two main cities in China: Guangzhou and Yiwu. These strategic locations allow us to cover most shipping needs from China.',
 2),

('expedition',
 'Combien de temps prend une expédition de la Chine vers Madagascar ?',
 'Le délai moyen d''expédition est de 25 à 35 jours ouvrables, incluant le transport maritime, le dédouanement et la livraison finale à Antananarivo. Ce délai peut varier selon les conditions météorologiques et les procédures douanières.',
 'How long does shipping from China to Madagascar take?',
 'The average shipping time is 25 to 35 business days, including maritime transport, customs clearance and final delivery to Antananarivo. This timeframe may vary depending on weather conditions and customs procedures.',
 3),

('suivi',
 'Comment puis-je suivre mon colis ?',
 'Vous pouvez suivre votre colis en utilisant votre pseudo client sur notre page de suivi. Entrez simplement votre pseudo pour voir l''état actuel de tous vos envois et leur progression détaillée.',
 'How can I track my package?',
 'You can track your package using your client pseudo on our tracking page. Simply enter your pseudo to see the current status of all your shipments and their detailed progress.',
 4),

('suivi',
 'Que signifient les différents statuts de suivi ?',
 'Les statuts indiquent où se trouve votre colis : "Enregistré en Chine" (reçu dans notre entrepôt), "En route vers Madagascar" (sur le navire), "Arrivé à Toamasina" (au port), "Arrivé à Antananarivo" (dans notre dépôt), "Prêt pour livraison" (disponible pour enlèvement).',
 'What do the different tracking statuses mean?',
 'The statuses indicate where your package is: "Registered in China" (received in our warehouse), "En route to Madagascar" (on the ship), "Arrived in Toamasina" (at the port), "Arrived in Antananarivo" (in our depot), "Ready for delivery" (available for pickup).',
 5),

('tarifs',
 'Comment sont calculés les tarifs de transport ?',
 'Nos tarifs sont calculés en fonction du poids, du volume et de la nature de vos marchandises. Nous utilisons le principe du "poids taxable" qui correspond au plus élevé entre le poids réel et le poids volumétrique. Contactez-nous pour un devis personnalisé.',
 'How are shipping rates calculated?',
 'Our rates are calculated based on the weight, volume and nature of your goods. We use the "chargeable weight" principle which corresponds to the higher of the actual weight and the volumetric weight. Contact us for a personalized quote.',
 6),

('douane',
 'Qui s''occupe des formalités douanières ?',
 'Continental Express Cargo prend en charge toutes les formalités douanières à Madagascar. Notre équipe expérimentée s''occupe du dédouanement de vos marchandises pour vous faire gagner du temps et éviter les complications.',
 'Who handles customs formalities?',
 'Continental Express Cargo handles all customs formalities in Madagascar. Our experienced team takes care of clearing your goods to save you time and avoid complications.',
 7),

('livraison',
 'Comment récupérer mes marchandises à Antananarivo ?',
 'Une fois vos marchandises arrivées à notre dépôt d''Antananarivo, nous vous contactons pour organiser la livraison ou l''enlèvement. Vous pouvez choisir de venir récupérer vos colis à notre entrepôt ou opter pour une livraison à domicile.',
 'How do I collect my goods in Antananarivo?',
 'Once your goods arrive at our Antananarivo depot, we contact you to organize delivery or pickup. You can choose to collect your packages at our warehouse or opt for home delivery.',
 8),

('problemes',
 'Que faire si mon colis est endommagé ?',
 'En cas de dommage, contactez-nous immédiatement avec des photos du colis et de son contenu. Nous avons une assurance transport qui couvre les dommages survenus pendant le transport maritime. Notre équipe vous accompagnera dans les démarches.',
 'What to do if my package is damaged?',
 'In case of damage, contact us immediately with photos of the package and its contents. We have transport insurance that covers damage occurring during maritime transport. Our team will assist you with the procedures.',
 9);