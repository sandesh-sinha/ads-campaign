// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here


let campaignTimeout;
let currentCampaign = 0;
let assetTimeout = 0;
const DURATION = 5000;
let currentAsset;

function activateNextAsset(asset) {
  console.log('activating next asset');
  if (!asset.classList.contains('active')) {
    asset.classList.add('active');
  }
}

function deactivateCurrentAsset(asset) {
  console.log('deactivating current asset');
  if (asset.classList.contains('active')) {
    asset.classList.remove('active');
  }
}

function deactivateCurrentCampaign(campaign) {
  console.log('deactivating campaign');
  if (campaign.classList.contains('active')) {
    campaign.classList.remove('active');
  }
}

function handleAssetTransition(sequence, leftSlots) {
  const campaign = sequence.children[currentCampaign];
  console.log(campaign);
  deactivateCurrentAsset(campaign.children[currentAsset]);
  currentAsset += 1;
  if (currentAsset === campaign.childElementCount) {
    currentAsset = 0;
  }
  leftSlots -= 1;
  if (leftSlots === 0) {
    clearTimeout(assetTimeout);
    campaign.dataset.nextplay = currentAsset;
    deactivateCurrentCampaign(campaign);
    currentCampaign += 1;
    if (currentCampaign === sequence.childElementCount) {
      currentCampaign = 0;
    }
    activateNextCampaign(sequence);
    return;
  }
  activateNextAsset(campaign.children[currentAsset]);
  assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, leftSlots);
}

function activateNextCampaign(sequence) {
  const campaign = sequence.children[currentCampaign];
  const alottedslots = sequence.children[currentCampaign].dataset.allotedslots
  if (!campaign.classList.contains('active')) {
    campaign.classList.add('active');
    currentAsset = campaign.dataset.nextplay ? Number(campaign.dataset.nextplay) : 0 ;
    activateNextAsset(campaign.children[currentAsset]);
    assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, alottedslots);
  }
}

function startCarousel() {
  const carousels = document.querySelectorAll('.sequence');
  if (carousels.length === 0) {
    console.log('no sequence registered');
    return;
  }
  const sequence = carousels[0];
  currentCampaign = 0;
  activateNextCampaign(sequence);
}

startCarousel();