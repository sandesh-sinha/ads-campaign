const fetchCampaigns = async (store) => {
  const response = await fetch(`https://allcampaigns-p7pabzploq-uc.a.run.app?store=${store}`);
  const campaigns = await response.json();
  return campaigns;
}

export default async function decorate(block) {
  const store = location.href.split('/')[location.href.split('/').length - 1];
  const campaigns = await fetchCampaigns(store);
  const carouselElements = [...block.children];
  const sequence = document.createElement('div');
  sequence.classList.add('sequence');
  console.log(campaigns);
  campaigns.forEach((campaign) => { 
    const campaignElement = document.createElement('div');
    campaignElement.classList.add('campaign');
    campaignElement.setAttribute('data-customer', campaign.customer);
    campaignElement.setAttribute('data-allotedslots', campaign.alottedSlots);
    campaign.assets.forEach((asset) => {
      const sequenceElement = document.createElement('div');
      sequenceElement.classList.add('sequence-element', 'fadeIn');
      let media = new Image();
      media.src = asset;
      media.alt = campaign.id;
      media.classList.add('sequence-element-img');
      sequenceElement.append(media);
      campaignElement.append(sequenceElement);
    });
    sequence.append(campaignElement);
  });
  block.textContent = '';
  block.append(sequence);
}
