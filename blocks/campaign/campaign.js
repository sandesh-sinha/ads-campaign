const fetchCampaigns = async (store) => {
  const response = await fetch(`https://allcampaigns-p7pabzploq-uc.a.run.app?store=${store}`);
  const campaigns = await response.json();
  return campaigns;
};

export default async function decorate(block) {
  const store = window.location.href.split('/')[window.location.href.split('/').length - 1].split('.')[0];
  const campaigns = await fetchCampaigns(store);
  const sequence = document.createElement('div');
  sequence.classList.add('sequence');
  console.log(campaigns);
  campaigns.forEach((campaign) => {
    const campaignElement = document.createElement('div');
    campaignElement.classList.add('campaign');
    campaignElement.setAttribute('data-customer', campaign.customer);
    campaignElement.setAttribute('data-allotedslots', campaign.alottedSlots);
    campaignElement.setAttribute('data-startdate', campaign.startDate);
    campaignElement.setAttribute('data-enddate', campaign.endDate);
    campaignElement.setAttribute('data-id', campaign.id);
    campaign.assets.forEach((asset) => {
      const sequenceElement = document.createElement('div');
      sequenceElement.classList.add('sequence-element', 'fadeIn');
      const media = new Image();
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
