import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, Clock, Globe, Zap } from 'lucide-react';
import ImageCarousel from './ImageCarousel';

interface HeroProps {
  onTrackingClick: () => void;
}

const Hero = memo(function Hero({ onTrackingClick }: HeroProps) {
  const { t } = useTranslation();

  // Images pour le carrousel
  const carouselImages = [
    "/Roll_Up_CEC.jpg",
    "/Depotage_CEC.jpg",
    "/Partnership_China_CEC.jpg",
    "/Entrepot_Chine_CEC.jpg"
  ];

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-relaxed">
                <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  {t('hero.title')}
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-pulse leading-relaxed">
                  {t('hero.subtitle')}
                </span>
              </h1>
              <p className="text-xl text-gray-200 leading-loose backdrop-blur-sm">
                {t('hero.description')}
              </p>
            </div>

            {/* CTA Buttons */}

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('hero.secure')}</h3>
                  <p className="text-gray-300 text-sm">{t('hero.secureDesc')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('hero.fast')}</h3>
                  <p className="text-gray-300 text-sm">{t('hero.fastDesc')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('hero.international')}</h3>
                  <p className="text-gray-300 text-sm">{t('hero.internationalDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <ImageCarousel
              images={carouselImages}
              autoPlayInterval={4000}
              className="relative z-10 h-96 group-hover:scale-105 transition-transform duration-500"
              showControls={true}
              showIndicators={true}
            />
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-20 blur-xl animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </section>
  )
});

export default Hero;
